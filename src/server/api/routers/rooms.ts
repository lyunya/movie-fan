import { randomBytes } from 'node:crypto'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { fetchTonightChoices } from '@/server/tmdb'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'

const filtersSchema = z.object({
  genreIds: z.array(z.number().int().positive()).max(8).default([]),
  maxRuntime: z.number().int().min(60).max(300).optional(),
  minScore: z.number().int().min(0).max(100).default(60),
})

export const roomsRouter = createTRPCRouter({
  mine: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.movieNightRoom.findMany({
      where: { hostId: ctx.session.user.id },
      include: {
        _count: { select: { candidates: true } },
        candidates: {
          select: { votes: { select: { voterToken: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
  ),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(80),
        filters: filtersSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [user, watched] = await Promise.all([
        ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { watchRegion: true, preferredProviders: true },
        }),
        ctx.prisma.watchListItem.findMany({
          where: { userId: ctx.session.user.id, userRating: { not: null } },
          select: { movieId: true },
        }),
      ])
      const seen = new Set(watched.map((movie) => movie.movieId))
      const movies = (
        await fetchTonightChoices({
          region: user?.watchRegion ?? 'US',
          providerIds: user?.preferredProviders ?? [],
          ...input.filters,
        })
      )
        .filter((movie) => !seen.has(movie.emsVersionId))
        .slice(0, 12)
      if (movies.length < 3) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Not enough movies matched those filters. Try widening them.',
        })
      }

      const shareCode = randomBytes(5).toString('hex')
      return ctx.prisma.movieNightRoom.create({
        data: {
          hostId: ctx.session.user.id,
          shareCode,
          name: input.name,
          filters: {
            genreIds: input.filters.genreIds,
            maxRuntime: input.filters.maxRuntime ?? null,
            minScore: input.filters.minScore,
          },
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          candidates: {
            create: movies.map((movie, position) => ({
              movieId: movie.emsVersionId,
              name: movie.name,
              posterImage: movie.posterImage.url || null,
              releaseDate: movie.releaseDate,
              tomatoMeter: movie.tomatoMeter,
              position,
            })),
          },
        },
        select: { shareCode: true },
      })
    }),

  byCode: publicProcedure
    .input(z.object({ code: z.string().trim().length(10) }))
    .query(async ({ ctx, input }) => {
      const room = await ctx.prisma.movieNightRoom.findUnique({
        where: { shareCode: input.code },
        include: {
          host: { select: { name: true } },
          candidates: {
            include: {
              votes: {
                select: { voterToken: true, voterName: true, liked: true },
              },
            },
            orderBy: { position: 'asc' },
          },
        },
      })
      if (!room || room.expiresAt <= new Date()) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      return room
    }),

  vote: publicProcedure
    .input(
      z.object({
        code: z.string().trim().length(10),
        candidateId: z.string().cuid(),
        voterToken: z.string().min(12).max(100),
        voterName: z.string().trim().min(1).max(40),
        liked: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const candidate = await ctx.prisma.movieNightCandidate.findFirst({
        where: {
          id: input.candidateId,
          room: { shareCode: input.code, expiresAt: { gt: new Date() } },
        },
        select: { id: true },
      })
      if (!candidate) throw new TRPCError({ code: 'NOT_FOUND' })
      return ctx.prisma.movieNightVote.upsert({
        where: {
          candidateId_voterToken: {
            candidateId: candidate.id,
            voterToken: input.voterToken,
          },
        },
        update: { liked: input.liked, voterName: input.voterName },
        create: {
          candidateId: candidate.id,
          voterToken: input.voterToken,
          voterName: input.voterName,
          liked: input.liked,
        },
      })
    }),
})
