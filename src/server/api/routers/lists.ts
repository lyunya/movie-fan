import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'

const movieSummary = z.object({
  movieId: z.string().min(1),
  name: z.string().trim().min(1).max(300),
  posterImage: z.string().nullable(),
  releaseDate: z.string().nullable(),
  tomatoMeter: z.number().int().min(0).max(100).nullable(),
})

export const listsRouter = createTRPCRouter({
  all: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.movieList.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        items: { orderBy: [{ position: 'asc' }, { addedAt: 'asc' }] },
      },
      orderBy: { updatedAt: 'desc' },
    })
  ),

  publicById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const list = await ctx.prisma.movieList.findUnique({
        where: { id: input.id },
        include: {
          user: { select: { name: true, image: true } },
          items: { orderBy: [{ position: 'asc' }, { addedAt: 'asc' }] },
        },
      })
      if (!list || (!list.isPublic && list.userId !== ctx.session?.user?.id)) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      return list
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(80),
        description: z.string().trim().max(500).optional(),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.movieList.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          description: input.description || null,
          isPublic: input.isPublic,
        },
      })
    ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().trim().min(1).max(80),
        description: z.string().trim().max(500).nullable(),
        isPublic: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.movieList.updateMany({
        where: { id, userId: ctx.session.user.id },
        data: { ...data, description: data.description || null },
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.movieList.deleteMany({
        where: { id: input.id, userId: ctx.session.user.id },
      })
    ),

  addMovie: protectedProcedure
    .input(z.object({ listId: z.string().cuid(), movie: movieSummary }))
    .mutation(async ({ ctx, input }) => {
      const list = await ctx.prisma.movieList.findFirst({
        where: { id: input.listId, userId: ctx.session.user.id },
        select: { id: true, _count: { select: { items: true } } },
      })
      if (!list) throw new TRPCError({ code: 'NOT_FOUND' })
      return ctx.prisma.movieListItem.upsert({
        where: {
          listId_movieId: { listId: list.id, movieId: input.movie.movieId },
        },
        update: input.movie,
        create: {
          listId: list.id,
          position: list._count.items,
          ...input.movie,
        },
      })
    }),

  removeMovie: protectedProcedure
    .input(z.object({ listId: z.string().cuid(), movieId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const list = await ctx.prisma.movieList.findFirst({
        where: { id: input.listId, userId: ctx.session.user.id },
        select: { id: true },
      })
      if (!list) throw new TRPCError({ code: 'NOT_FOUND' })
      return ctx.prisma.movieListItem.deleteMany({
        where: { listId: list.id, movieId: input.movieId },
      })
    }),
})
