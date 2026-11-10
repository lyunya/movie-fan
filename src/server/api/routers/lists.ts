import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'
import { catalog } from '@/server/catalog'
import { pooled } from '@/server/availability/createAvailability'
import { listItemSnapshot } from '@/server/library'

const filmId = z.string().regex(/^[1-9]\d*$/)

/** List items store a snapshot built from the Catalog, never from the client. */
const snapshotFor = async (id: string) => {
  const film = await catalog.filmDetail(id)
  if (!film)
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Could not load this movie. Please try again.',
    })
  return listItemSnapshot(film)
}

const fresh = <T extends { movieId: string }>(
  snapshots: T[],
  present: ReadonlySet<string>
) => snapshots.filter((s) => !present.has(s.movieId))

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
          user: { select: { id: true, handle: true, name: true, image: true } },
          items: { orderBy: [{ position: 'asc' }, { addedAt: 'asc' }] },
        },
      })
      if (!list || (!list.isPublic && list.userId !== ctx.session?.user?.id)) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      const viewer = ctx.session?.user?.id
      if (
        viewer &&
        viewer !== list.userId &&
        (await ctx.prisma.userConnection.findFirst({
          where: {
            kind: 'BLOCK',
            OR: [
              { userId: viewer, targetId: list.userId },
              { userId: list.userId, targetId: viewer },
            ],
          },
        }))
      ) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      return list
    }),

  createWithMovie: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(80),
        ranked: z.boolean().default(false),
        filmId,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const snapshot = await snapshotFor(input.filmId)
      return ctx.prisma.movieList.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          ranked: input.ranked,
          items: { create: { ...snapshot, position: 0 } },
        },
      })
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(80),
        description: z.string().trim().max(500).optional(),
        isPublic: z.boolean().default(false),
        ranked: z.boolean().default(false),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.movieList.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          description: input.description || null,
          isPublic: input.isPublic,
          ranked: input.ranked,
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
        ranked: z.boolean().optional(),
        coverMovieId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      if (
        data.coverMovieId &&
        !(await ctx.prisma.movieListItem.findFirst({
          where: {
            listId: id,
            movieId: data.coverMovieId,
            list: { userId: ctx.session.user.id },
          },
        }))
      )
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Choose a cover from the films in this list.',
        })
      return ctx.prisma.movieList.updateMany({
        where: { id, userId: ctx.session.user.id },
        data: { ...data, description: data.description || null },
      })
    }),

  reorder: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        version: z.number().int(),
        itemIds: z.array(z.string().cuid()).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const claimed = await tx.movieList.updateMany({
          where: {
            id: input.id,
            userId: ctx.session.user.id,
            version: input.version,
          },
          data: { version: { increment: 1 } },
        })
        if (!claimed.count)
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'This list changed in another tab. Refresh and try again.',
          })
        const items = await tx.movieListItem.findMany({
          where: { listId: input.id },
          select: { id: true },
        })
        if (
          new Set(input.itemIds).size !== items.length ||
          input.itemIds.length !== items.length ||
          items.some((i) => !input.itemIds.includes(i.id))
        )
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'The ordering must include each film exactly once.',
          })
        // One statement for the whole order, not one round trip per film
        await tx.$executeRaw`
          UPDATE "MovieListItem" AS item
          SET "position" = ordered.position - 1
          FROM unnest(${input.itemIds}::text[]) WITH ORDINALITY AS ordered(id, position)
          WHERE item."id" = ordered.id AND item."listId" = ${input.id}`
        return { version: input.version + 1 }
      })
    }),
  note: protectedProcedure
    .input(
      z.object({
        listId: z.string().cuid(),
        movieId: z.string(),
        note: z.string().max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const list = await ctx.prisma.movieList.findFirst({
        where: { id: input.listId, userId: ctx.session.user.id },
      })
      if (!list) throw new TRPCError({ code: 'NOT_FOUND' })
      return ctx.prisma.movieListItem.update({
        where: {
          listId_movieId: { listId: input.listId, movieId: input.movieId },
        },
        data: { note: input.note || null },
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
    .input(z.object({ listId: z.string().cuid(), filmId }))
    .mutation(async ({ ctx, input }) => {
      const snapshot = await snapshotFor(input.filmId)
      return ctx.prisma.$transaction(async (tx) => {
        const claimed = await tx.movieList.updateMany({
          where: { id: input.listId, userId: ctx.session.user.id },
          data: { version: { increment: 1 }, updatedAt: new Date() },
        })
        if (!claimed.count) throw new TRPCError({ code: 'NOT_FOUND' })
        const last = await tx.movieListItem.aggregate({
          where: { listId: input.listId },
          _max: { position: true },
        })
        return tx.movieListItem.upsert({
          where: {
            listId_movieId: {
              listId: input.listId,
              movieId: snapshot.movieId,
            },
          },
          update: {},
          create: {
            listId: input.listId,
            position: (last._max.position ?? -1) + 1,
            ...snapshot,
          },
        })
      })
    }),
  /** Add several Films at once; ones already in the List are left alone. */
  addMovies: protectedProcedure
    .input(
      z.object({
        listId: z.string().cuid(),
        filmIds: z.array(filmId).min(1).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ids = [...new Set(input.filmIds)]
      const found = await pooled(ids, 5, (id) =>
        catalog
          .filmDetail(id)
          .then((film) => (film ? listItemSnapshot(film) : null))
          .catch(() => null)
      )
      const snapshots = found.filter((s) => s !== null)
      const added = await ctx.prisma.$transaction(async (tx) => {
        const claimed = await tx.movieList.updateMany({
          where: { id: input.listId, userId: ctx.session.user.id },
          data: { version: { increment: 1 }, updatedAt: new Date() },
        })
        if (!claimed.count) throw new TRPCError({ code: 'NOT_FOUND' })
        const last = await tx.movieListItem.aggregate({
          where: { listId: input.listId },
          _max: { position: true },
        })
        const start = (last._max.position ?? -1) + 1
        const present = new Set(
          (
            await tx.movieListItem.findMany({
              where: { listId: input.listId },
              select: { movieId: true },
            })
          ).map((item) => item.movieId)
        )
        const result = await tx.movieListItem.createMany({
          data: fresh(snapshots, present).map((snapshot, i) => ({
            listId: input.listId,
            position: start + i,
            ...snapshot,
          })),
          skipDuplicates: true,
        })
        return result.count
      })
      return { added, failed: ids.length - snapshots.length }
    }),
  removeMovie: protectedProcedure
    .input(z.object({ listId: z.string().cuid(), movieId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.$transaction(async (tx) => {
        const claimed = await tx.movieList.updateMany({
          where: { id: input.listId, userId: ctx.session.user.id },
          data: { version: { increment: 1 }, updatedAt: new Date() },
        })
        if (!claimed.count) throw new TRPCError({ code: 'NOT_FOUND' })
        return tx.movieListItem.deleteMany({
          where: { listId: input.listId, movieId: input.movieId },
        })
      })
    ),
})
