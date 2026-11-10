import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import type { PrismaClient } from '@prisma/client'
import { createTRPCRouter, protectedProcedure } from '../trpc'

/**
 * The people whose shared activity a Member sees: those they follow who are
 * still public, minus anyone muted or blocked in either direction.
 */
async function circleOf(prisma: PrismaClient, userId: string) {
  const connections = await prisma.userConnection.findMany({
    where: { OR: [{ userId }, { targetId: userId, kind: 'BLOCK' }] },
  })
  const excluded = new Set(
    connections
      .filter((c) => c.kind === 'BLOCK' || c.kind === 'MUTE')
      .map((c) => (c.userId === userId ? c.targetId : c.userId))
  )
  const ids = connections
    .filter((c) => c.kind === 'FOLLOW' && !excluded.has(c.targetId))
    .map((c) => c.targetId)
  if (!ids.length) return []
  return prisma.user.findMany({
    where: { id: { in: ids }, publicWatchlist: true },
    select: { id: true, name: true, handle: true, image: true },
  })
}

export const socialRouter = createTRPCRouter({
  people: protectedProcedure
    .input(z.object({ query: z.string().trim().max(80) }))
    .query(async ({ ctx, input }) => {
      const blocked = await ctx.prisma.userConnection.findMany({
        where: {
          kind: 'BLOCK',
          OR: [
            { userId: ctx.session.user.id },
            { targetId: ctx.session.user.id },
          ],
        },
      })
      return ctx.prisma.user.findMany({
        where: {
          publicWatchlist: true,
          id: {
            notIn: [
              ctx.session.user.id,
              ...blocked.map((b) =>
                b.userId === ctx.session.user.id ? b.targetId : b.userId
              ),
            ],
          },
          OR: [
            { handle: { contains: input.query, mode: 'insensitive' } },
            { name: { contains: input.query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, handle: true, bio: true, image: true },
        take: 20,
      })
    }),
  connections: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.userConnection.findMany({
      where: { userId: ctx.session.user.id },
      include: { target: { select: { name: true, handle: true } } },
    })
  ),
  connect: protectedProcedure
    .input(
      z.object({
        targetId: z.string(),
        kind: z.enum(['FOLLOW', 'MUTE', 'BLOCK']),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      if (userId === input.targetId)
        throw new TRPCError({ code: 'BAD_REQUEST' })
      const target = await ctx.prisma.user.findUnique({
        where: { id: input.targetId },
        select: { publicWatchlist: true },
      })
      if (!target) throw new TRPCError({ code: 'NOT_FOUND' })
      if (input.kind === 'FOLLOW' && input.enabled) {
        const block = await ctx.prisma.userConnection.findFirst({
          where: {
            kind: 'BLOCK',
            OR: [
              { userId, targetId: input.targetId },
              { userId: input.targetId, targetId: userId },
            ],
          },
        })
        if (block || !target.publicWatchlist)
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'This profile is unavailable.',
          })
      }
      return ctx.prisma.$transaction(async (tx) => {
        if (input.kind === 'BLOCK' && input.enabled)
          await tx.userConnection.deleteMany({
            where: {
              kind: 'FOLLOW',
              OR: [
                { userId, targetId: input.targetId },
                { userId: input.targetId, targetId: userId },
              ],
            },
          })
        if (!input.enabled)
          return tx.userConnection.deleteMany({
            where: { userId, targetId: input.targetId, kind: input.kind },
          })
        return tx.userConnection.upsert({
          where: {
            userId_targetId_kind: {
              userId,
              targetId: input.targetId,
              kind: input.kind,
            },
          },
          update: {},
          create: { userId, targetId: input.targetId, kind: input.kind },
        })
      })
    }),
  /** What the people a Member follows shared about one Film, newest first. */
  filmActivity: protectedProcedure
    .input(z.object({ filmId: z.string().regex(/^[1-9]\d*$/) }))
    .query(async ({ ctx, input }) => {
      const users = await circleOf(ctx.prisma, ctx.session.user.id)
      if (!users.length) return []
      const byId = new Map(users.map((u) => [u.id, u]))
      const entries = await ctx.prisma.watchEvent.findMany({
        where: {
          userId: { in: users.map((u) => u.id) },
          movieId: input.filmId,
          isPublic: true,
        },
        orderBy: { watchedAt: 'desc' },
        take: 12,
        select: {
          id: true,
          userId: true,
          rating: true,
          review: true,
          spoiler: true,
          watchedAt: true,
        },
      })
      return entries.map(({ userId, ...entry }) => ({
        ...entry,
        member: byId.get(userId)!,
      }))
    }),
  feed: protectedProcedure.query(async ({ ctx }) => {
    const users = await circleOf(ctx.prisma, ctx.session.user.id)
    const visible = users.map((u) => u.id)
    const [entries, lists] = await Promise.all([
      ctx.prisma.watchEvent.findMany({
        where: { userId: { in: visible }, isPublic: true },
        orderBy: { createdAt: 'desc' },
        take: 40,
      }),
      ctx.prisma.movieList.findMany({
        where: { userId: { in: visible }, isPublic: true },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        include: { _count: { select: { items: true } } },
      }),
    ])
    return { users, entries, lists }
  }),
})
