import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { MovieSchema } from '@/types/MovieSchema'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { catalog } from '@/server/catalog'
import { createMovieObj } from '@/utils/createMovieObj'

export const watchListItemRouter = createTRPCRouter({
  importMovie: protectedProcedure
    .input(
      z.object({
        movieId: z.string().regex(/^[1-9]\d*$/),
        rating: z.number().int().min(1).max(5).nullable(),
        watchedDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const watchedAt = input.watchedDate ? new Date(input.watchedDate) : null
      if (
        watchedAt &&
        (!Number.isFinite(watchedAt.getTime()) ||
          watchedAt.toISOString().slice(0, 10) !== input.watchedDate ||
          watchedAt > new Date())
      )
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid watched date.',
        })
      if (
        await ctx.prisma.watchListItem.findUnique({
          where: { userId_movieId: { userId, movieId: input.movieId } },
        })
      )
        return { added: false }
      const movie = await catalog.filmDetail(input.movieId)
      if (!movie)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Movie unavailable. Choose another match or skip this row.',
        })
      const data = createMovieObj(movie, input.rating)
      return ctx.prisma.$transaction(async (tx) => {
        const watched = !!watchedAt || input.rating !== null
        const result = await tx.watchListItem.createMany({
          data: [
            {
              ...data,
              userId,
              watched,
              inWatchlist: !watched,
              savedAt: watched ? null : new Date(),
              lastWatchedAt: watchedAt,
            },
          ],
          skipDuplicates: true,
        })
        if (result.count && watchedAt)
          await tx.watchEvent.create({
            data: {
              userId,
              movieId: input.movieId,
              name: data.name,
              posterImage: data.posterImage,
              releaseDate: data.releaseDate,
              durationMinutes: data.durationMinutes,
              genres: data.genres,
              rating: input.rating,
              watchedAt,
              isPublic: false,
            },
          })
        return { added: result.count === 1 }
      })
    }),
  quickAdd: protectedProcedure
    .input(z.object({ movieId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const existing = await ctx.prisma.watchListItem.findUnique({
        where: { userId_movieId: { userId, movieId: input.movieId } },
      })
      if (existing)
        return ctx.prisma.watchListItem.update({
          where: { id: existing.id },
          data: { inWatchlist: true, savedAt: new Date() },
        })
      const movie = await catalog.filmDetail(input.movieId)
      if (!movie)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Could not load this movie. Please try again.',
        })
      const movieData = createMovieObj(movie)
      return ctx.prisma.watchListItem.upsert({
        where: { userId_movieId: { userId, movieId: input.movieId } },
        update: { inWatchlist: true, savedAt: new Date() },
        create: {
          ...movieData,
          userId,
          inWatchlist: true,
          savedAt: new Date(),
        },
      })
    }),
  create: protectedProcedure
    .input(z.object({ movieData: MovieSchema }))
    .mutation(({ ctx, input }) => {
      const { userRating, ...fields } = input.movieData
      return ctx.prisma.watchListItem.upsert({
        where: {
          userId_movieId: {
            userId: ctx.session.user.id,
            movieId: fields.movieId,
          },
        },
        update: {
          ...fields,
          ...(userRating != null
            ? { userRating, watched: true }
            : { inWatchlist: true, savedAt: new Date() }),
        },
        create: {
          ...fields,
          userId: ctx.session.user.id,
          userRating,
          watched: userRating != null,
          inWatchlist: userRating == null,
          savedAt: userRating == null ? new Date() : null,
        },
      })
    }),
  setState: protectedProcedure
    .input(
      z.object({
        movieId: z.string().min(1),
        inWatchlist: z.boolean().optional(),
        watched: z.boolean().optional(),
        favorite: z.boolean().optional(),
        userRating: z.number().int().min(1).max(5).nullable().optional(),
        dismissed: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { movieId, ...changes } = input
      const userId = ctx.session.user.id
      const existing = await ctx.prisma.watchListItem.findUnique({
        where: { userId_movieId: { userId, movieId } },
      })
      if (
        changes.watched === false &&
        (await ctx.prisma.watchEvent.count({ where: { userId, movieId } }))
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'This movie has diary entries. Edit those viewings before marking it unwatched.',
        })
      }
      const data = {
        ...changes,
        ...(changes.inWatchlist === true ? { savedAt: new Date() } : {}),
      }
      if (existing)
        return ctx.prisma.watchListItem.update({
          where: { id: existing.id },
          data,
        })
      const movie = await catalog.filmDetail(movieId)
      if (!movie) throw new TRPCError({ code: 'NOT_FOUND' })
      return ctx.prisma.watchListItem.create({
        data: {
          ...createMovieObj(movie),
          userId,
          inWatchlist: false,
          ...data,
        },
      })
    }),
  delete: protectedProcedure
    .input(z.object({ movieId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.watchListItem.updateMany({
        where: { userId: ctx.session.user.id, movieId: input.movieId },
        data: { inWatchlist: false },
      })
    ),
  bulk: protectedProcedure
    .input(
      z.object({
        movieIds: z.array(z.string()).min(1).max(100),
        action: z.enum(['save', 'unsave', 'watched']),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.watchListItem.updateMany({
        where: { userId: ctx.session.user.id, movieId: { in: input.movieIds } },
        data:
          input.action === 'watched'
            ? { watched: true }
            : {
                inWatchlist: input.action === 'save',
                ...(input.action === 'save' ? { savedAt: new Date() } : {}),
              },
      })
    ),
  query: protectedProcedure
    .input(z.object({ movieId: z.string() }))
    .query(async ({ ctx, input }) => ({
      movie: await ctx.prisma.watchListItem.findMany({
        where: { userId: ctx.session.user.id, movieId: input.movieId },
      }),
    })),
})
