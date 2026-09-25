import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { library, LibraryError } from '@/server/library'

const filmId = z.string().regex(/^[1-9]\d*$/)
const rating = z.number().int().min(1).max(5)

const action = z.discriminatedUnion('type', [
  z.object({ type: z.literal('save') }),
  z.object({ type: z.literal('unsave') }),
  z.object({ type: z.literal('markWatched') }),
  z.object({ type: z.literal('markUnwatched') }),
  z.object({ type: z.literal('rate'), rating }),
  z.object({ type: z.literal('clearRating') }),
  z.object({ type: z.literal('favorite') }),
  z.object({ type: z.literal('unfavorite') }),
  z.object({ type: z.literal('dismiss') }),
])

const entryState = z
  .object({
    inWatchlist: z.boolean(),
    watched: z.boolean(),
    favorite: z.boolean(),
    dismissed: z.boolean(),
    rating: rating.nullable(),
    savedAt: z.coerce.date().nullable(),
  })
  .nullable()

const viewing = z.object({
  watchedAt: z.coerce.date(),
  isPublic: z.boolean().default(false),
  spoiler: z.boolean().default(false),
  rating: rating.nullable(),
  review: z.string().trim().max(4000).nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).max(12),
})

/** Library errors become the matching API errors, with their messages. */
const run = async <T>(work: () => Promise<T>) => {
  try {
    return await work()
  } catch (error) {
    if (error instanceof LibraryError)
      throw new TRPCError({
        code: error.code === 'HAS_VIEWINGS' ? 'CONFLICT' : 'NOT_FOUND',
        message: error.message,
      })
    throw error
  }
}

const member = (ctx: { session: { user: { id: string } } }) =>
  library.forMember(ctx.session.user.id)

export const libraryRouter = createTRPCRouter({
  index: protectedProcedure.query(({ ctx }) => member(ctx).index()),
  entries: protectedProcedure.query(({ ctx }) => member(ctx).entries()),
  upNext: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(12) }))
    .query(({ ctx, input }) => member(ctx).upNext(input.limit)),

  change: protectedProcedure
    .input(z.object({ filmId, action }))
    .mutation(({ ctx, input }) =>
      run(() => member(ctx).change(input.filmId, input.action))
    ),

  restore: protectedProcedure
    .input(z.object({ filmId, previous: entryState }))
    .mutation(({ ctx, input }) =>
      run(() => member(ctx).restore(input.filmId, input.previous))
    ),

  bulk: protectedProcedure
    .input(
      z.object({
        action: z.enum(['save', 'unsave', 'markWatched']),
        filmIds: z.array(filmId).min(1).max(100),
      })
    )
    .mutation(({ ctx, input }) =>
      member(ctx).apply(input.action, input.filmIds)
    ),

  logViewing: protectedProcedure
    .input(z.object({ filmId, viewing, useRating: z.boolean().default(true) }))
    .mutation(({ ctx, input }) =>
      run(() =>
        member(ctx).logViewing(input.filmId, input.viewing, {
          useRating: input.useRating,
        })
      )
    ),

  editViewing: protectedProcedure
    .input(z.object({ id: z.string().cuid(), viewing }))
    .mutation(({ ctx, input }) =>
      run(() => member(ctx).editViewing(input.id, input.viewing))
    ),

  deleteViewing: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(({ ctx, input }) =>
      run(() => member(ctx).deleteViewing(input.id))
    ),

  importFilm: protectedProcedure
    .input(
      z.object({
        filmId,
        rating: rating.nullable(),
        watchedDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .nullable(),
      })
    )
    .mutation(({ ctx, input }) => {
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
      return run(() =>
        member(ctx).importFilm(input.filmId, {
          rating: input.rating,
          watchedAt,
        })
      ).catch((error) => {
        if (error instanceof TRPCError && error.code === 'NOT_FOUND')
          throw new TRPCError({
            code: 'NOT_FOUND',
            message:
              'Movie unavailable. Choose another match or skip this row.',
          })
        throw error
      })
    }),
})
