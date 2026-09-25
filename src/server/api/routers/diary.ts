import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '../trpc'

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
})
