import { z } from 'zod'

import { MovieSchema } from '@/types/MovieSchema'
import { createTRPCRouter, protectedProcedure } from '../trpc'

const diaryFields = z.object({
  watchedAt: z.coerce.date(),
  rating: z.number().int().min(1).max(5).nullable(),
  review: z.string().trim().max(4000).nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).max(12),
})

export const diaryRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({ year: z.number().int().min(1900).max(2200).optional() })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const year = input?.year
      const where = year
        ? {
            userId: ctx.session.user.id,
            watchedAt: {
              gte: new Date(Date.UTC(year, 0, 1)),
              lt: new Date(Date.UTC(year + 1, 0, 1)),
            },
          }
        : { userId: ctx.session.user.id }
      return ctx.prisma.watchEvent.findMany({
        where,
        orderBy: [{ watchedAt: 'desc' }, { createdAt: 'desc' }],
      })
    }),

  log: protectedProcedure
    .input(z.object({ movieData: MovieSchema, entry: diaryFields }))
    .mutation(async ({ ctx, input }) => {
      const { movieData, entry } = input
      const userId = ctx.session.user.id
      const movieFields = {
        movieId: movieData.movieId,
        directedBy: movieData.directedBy,
        durationMinutes: movieData.durationMinutes,
        name: movieData.name,
        posterImage: movieData.posterImage,
        synopsis: movieData.synopsis,
        tomatoMeter: movieData.tomatoMeter,
        consensus: movieData.consensus,
        totalGross: movieData.totalGross,
        releaseDate: movieData.releaseDate,
        emsVersionId: movieData.emsVersionId,
        motionPictureRating: movieData.motionPictureRating,
        genres: movieData.genres,
      }

      return ctx.prisma.$transaction(async (tx) => {
        await tx.watchListItem.upsert({
          where: { userId_movieId: { userId, movieId: movieData.movieId } },
          update: {
            ...movieFields,
            ...(entry.rating != null ? { userRating: entry.rating } : {}),
          },
          create: {
            ...movieFields,
            userRating: entry.rating,
            user: { connect: { id: userId } },
          },
        })
        return tx.watchEvent.create({
          data: {
            userId,
            movieId: movieData.movieId,
            name: movieData.name,
            posterImage: movieData.posterImage || null,
            releaseDate: movieData.releaseDate || null,
            durationMinutes: movieData.durationMinutes,
            genres: movieData.genres,
            watchedAt: entry.watchedAt,
            rating: entry.rating,
            review: entry.review || null,
            tags: entry.tags,
          },
        })
      })
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().cuid(), entry: diaryFields }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.watchEvent.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      })
      if (!existing) return null
      return ctx.prisma.watchEvent.update({
        where: { id: existing.id },
        data: {
          watchedAt: input.entry.watchedAt,
          rating: input.entry.rating,
          review: input.entry.review || null,
          tags: input.entry.tags,
        },
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.watchEvent.deleteMany({
        where: { id: input.id, userId: ctx.session.user.id },
      })
    }),
})
