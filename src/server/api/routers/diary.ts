import type { Prisma } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { MovieSchema } from '@/types/MovieSchema'
import { createTRPCRouter, protectedProcedure } from '../trpc'

async function refreshLastWatch(
  tx: Prisma.TransactionClient,
  userId: string,
  movieId: string
) {
  const latest = await tx.watchEvent.aggregate({
    where: { userId, movieId },
    _max: { watchedAt: true },
  })
  await tx.watchListItem.updateMany({
    where: { userId, movieId },
    data: { lastWatchedAt: latest._max.watchedAt },
  })
}
const diaryFields = z.object({
  watchedAt: z.coerce.date(),
  isPublic: z.boolean().default(false),
  spoiler: z.boolean().default(false),
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

  history: protectedProcedure
    .input(z.object({ movieId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.watchEvent.findMany({
        where: { userId: ctx.session.user.id, movieId: input.movieId },
        orderBy: { watchedAt: 'desc' },
      })
    ),
  years: protectedProcedure.query(async ({ ctx }) => {
    const entries = await ctx.prisma.watchEvent.findMany({
      where: { userId: ctx.session.user.id },
      select: { watchedAt: true, movieId: true },
      orderBy: { watchedAt: 'asc' },
    })
    const firstWatches: Record<string, Date> = {}
    for (const entry of entries)
      if (!firstWatches[entry.movieId])
        firstWatches[entry.movieId] = entry.watchedAt
    return {
      years: [
        ...new Set([
          new Date().getFullYear(),
          ...entries.map((e) => e.watchedAt.getUTCFullYear()),
        ]),
      ].sort((a, b) => b - a),
      firstWatches,
    }
  }),
  log: protectedProcedure
    .input(
      z.object({
        movieData: MovieSchema,
        entry: diaryFields,
        keepOnWatchlist: z.boolean().default(false),
        updateRating: z.boolean().default(true),
      })
    )
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
            watched: true,
            inWatchlist: input.keepOnWatchlist,
            ...(input.updateRating && entry.rating != null
              ? { userRating: entry.rating }
              : {}),
          },
          create: {
            ...movieFields,
            userRating: input.updateRating ? entry.rating : null,
            watched: true,
            inWatchlist: input.keepOnWatchlist,
            user: { connect: { id: userId } },
          },
        })
        const event = await tx.watchEvent.create({
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
            isPublic: entry.isPublic,
            spoiler: entry.spoiler,
            review: entry.review || null,
            tags: entry.tags,
          },
        })
        await refreshLastWatch(tx, userId, movieData.movieId)
        return event
      })
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().cuid(), entry: diaryFields }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.watchEvent.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      })
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' })
      return ctx.prisma.$transaction(async (tx) => {
        const event = await tx.watchEvent.update({
          where: { id: existing.id },
          data: {
            watchedAt: input.entry.watchedAt,
            rating: input.entry.rating,
            isPublic: input.entry.isPublic,
            spoiler: input.entry.spoiler,
            review: input.entry.review || null,
            tags: input.entry.tags,
          },
        })
        await refreshLastWatch(tx, ctx.session.user.id, existing.movieId)
        return event
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const entry = await tx.watchEvent.findFirst({
          where: { id: input.id, userId: ctx.session.user.id },
        })
        if (!entry) throw new TRPCError({ code: 'NOT_FOUND' })
        await tx.watchEvent.delete({ where: { id: entry.id } })
        await refreshLastWatch(tx, ctx.session.user.id, entry.movieId)
        return { ok: true }
      })
    }),
})
