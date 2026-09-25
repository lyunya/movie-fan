/**
 * The Library module: everything a Member does to their own Library —
 * saving, watching, rating, favoriting, dismissing, logging Viewings — behind
 * one method per action. Every method enforces the rules in ./rules and
 * returns the entry's previous state, so any action can be undone exactly
 * with `restore()`.
 *
 * `createLibrary({ db, films })` takes the database and the Catalog as
 * arguments, so tests run it against a real Postgres with the offline
 * catalog.
 */
import type { Prisma, PrismaClient, WatchListItem } from '@prisma/client'
import type { FilmDetail } from '@/server/catalog/types'
import {
  applyRules,
  needsEntry,
  NO_ENTRY,
  type EntryAction,
  type EntryChangeAction,
  type EntryFlags,
} from './rules'
import { entrySnapshot, viewingSnapshot } from './snapshot'
import type {
  BulkAction,
  EntryChange,
  EntryState,
  IndexEntry,
  LibraryEntry,
  ViewingInput,
} from './types'

export class LibraryError extends Error {
  constructor(
    public code: 'FILM_NOT_FOUND' | 'HAS_VIEWINGS' | 'VIEWING_NOT_FOUND',
    message: string
  ) {
    super(message)
  }
}

const flagsOf = (row: WatchListItem): EntryFlags => ({
  inWatchlist: row.inWatchlist,
  watched: row.watched,
  favorite: row.favorite,
  dismissed: row.dismissed,
  rating: row.userRating,
})

const stateOf = (row: WatchListItem | null): EntryState =>
  row ? { ...flagsOf(row), savedAt: row.savedAt } : null

const indexOf = (row: WatchListItem): IndexEntry => ({
  filmId: row.movieId,
  ...flagsOf(row),
})

const columns = (flags: EntryFlags, savedAt: Date | null) => ({
  inWatchlist: flags.inWatchlist,
  watched: flags.watched,
  favorite: flags.favorite,
  dismissed: flags.dismissed,
  userRating: flags.rating,
  savedAt,
})

const toEntry = (row: WatchListItem): LibraryEntry => ({
  ...indexOf(row),
  title: row.name,
  posterPath: row.posterImage || null,
  releaseDate: row.releaseDate || null,
  runtime: row.durationMinutes || null,
  genres: row.genres,
  directedBy: row.directedBy || null,
  tmdbPercent: row.tomatoMeter,
  certification:
    row.motionPictureRating && row.motionPictureRating !== 'Not Rated'
      ? row.motionPictureRating
      : null,
  savedAt: row.savedAt,
  lastWatchedAt: row.lastWatchedAt,
  updatedAt: row.updatedAt,
})

export function createLibrary({
  db,
  films,
}: {
  db: PrismaClient
  films: { filmDetail(id: string): Promise<FilmDetail | null> }
}) {
  const requireFilm = async (filmId: string) => {
    const film = await films.filmDetail(filmId)
    if (!film)
      throw new LibraryError(
        'FILM_NOT_FOUND',
        'Could not load this movie. Please try again.'
      )
    return film
  }

  function forMember(memberId: string) {
    const key = (filmId: string) => ({
      userId_movieId: { userId: memberId, movieId: filmId },
    })

    const refreshLastWatch = async (
      tx: Prisma.TransactionClient,
      filmId: string
    ) => {
      const latest = await tx.watchEvent.aggregate({
        where: { userId: memberId, movieId: filmId },
        _max: { watchedAt: true },
      })
      await tx.watchListItem.updateMany({
        where: { userId: memberId, movieId: filmId },
        data: { lastWatchedAt: latest._max.watchedAt },
      })
    }

    /** Lock a Film's entry for the rest of the transaction, if it exists. */
    const lock = (tx: Prisma.TransactionClient, filmId: string) =>
      tx.$queryRaw`SELECT id FROM "WatchListItem" WHERE "userId" = ${memberId} AND "movieId" = ${filmId} FOR UPDATE`

    /**
     * Change a Film's entry inside one transaction, with its row locked so
     * concurrent changes to the same Film apply one after another instead of
     * overwriting each other. A missing entry is created first (its snapshot
     * from the Catalog, asked outside the transaction) and reported as
     * `previous: null`.
     */
    async function write(
      filmId: string,
      next: (
        row: WatchListItem | null,
        tx: Prisma.TransactionClient
      ) => Promise<{ flags: EntryFlags; savedAt: Date | null }>,
      extra?: (
        tx: Prisma.TransactionClient,
        row: WatchListItem
      ) => Promise<void>
    ) {
      const existing = await db.watchListItem.findUnique({
        where: key(filmId),
      })
      const film = existing ? null : await requireFilm(filmId)
      return db.$transaction(async (tx) => {
        await lock(tx, filmId)
        let row = await tx.watchListItem.findUnique({ where: key(filmId) })
        let created = false
        if (!row) {
          const inserted = await tx.watchListItem.createMany({
            data: [
              {
                ...entrySnapshot(film ?? (await requireFilm(filmId))),
                userId: memberId,
                ...columns(NO_ENTRY, null),
              },
            ],
            skipDuplicates: true,
          })
          created = inserted.count === 1
          await lock(tx, filmId)
          row = await tx.watchListItem.findUniqueOrThrow({ where: key(filmId) })
        }
        const current = created ? null : row
        const { flags, savedAt } = await next(current, tx)
        const saved = await tx.watchListItem.update({
          where: { id: row.id },
          data: columns(flags, savedAt),
        })
        await extra?.(tx, saved)
        return { previous: stateOf(current), row: saved }
      })
    }

    async function change(
      filmId: string,
      action: EntryChangeAction
    ): Promise<EntryChange> {
      if (
        needsEntry(action) &&
        !(await db.watchListItem.findUnique({ where: key(filmId) }))
      )
        return { filmId, previous: null, entry: null }
      const { previous, row } = await write(filmId, async (current, tx) => {
        if (action.type === 'markUnwatched') {
          const viewings = await tx.watchEvent.count({
            where: { userId: memberId, movieId: filmId },
          })
          if (viewings)
            throw new LibraryError(
              'HAS_VIEWINGS',
              'This movie has diary entries. Edit those viewings before marking it unwatched.'
            )
        }
        return {
          flags: applyRules(current ? flagsOf(current) : null, action),
          savedAt:
            action.type === 'save' ? new Date() : (current?.savedAt ?? null),
        }
      })
      return { filmId, previous, entry: indexOf(row) }
    }

    return {
      /* ------------------------------ reads ------------------------------ */

      /** Every Film in the Library, flags only. Cheap enough for every page. */
      async index(): Promise<IndexEntry[]> {
        const rows = await db.watchListItem.findMany({
          where: { userId: memberId },
          select: {
            movieId: true,
            inWatchlist: true,
            watched: true,
            favorite: true,
            dismissed: true,
            userRating: true,
          },
        })
        return rows.map((r) => ({
          filmId: r.movieId,
          inWatchlist: r.inWatchlist,
          watched: r.watched,
          favorite: r.favorite,
          dismissed: r.dismissed,
          rating: r.userRating,
        }))
      },

      /** Full entries with their Film snapshots, for the Library page. */
      async entries(): Promise<LibraryEntry[]> {
        const rows = await db.watchListItem.findMany({
          where: { userId: memberId },
          orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        })
        return rows.map(toEntry)
      },

      /** Watchlist Films not yet watched, most recently saved first. */
      async upNext(limit = 12): Promise<LibraryEntry[]> {
        const rows = await db.watchListItem.findMany({
          where: { userId: memberId, inWatchlist: true, watched: false },
          orderBy: [
            { savedAt: { sort: 'desc', nulls: 'last' } },
            { id: 'asc' },
          ],
          take: limit,
        })
        return rows.map(toEntry)
      },

      /* ----------------------------- actions ----------------------------- */

      save: (filmId: string) => change(filmId, { type: 'save' }),
      unsave: (filmId: string) => change(filmId, { type: 'unsave' }),
      markWatched: (filmId: string) => change(filmId, { type: 'markWatched' }),
      /** Refused while the Film has Viewings; clears its Rating and Favorite. */
      markUnwatched: (filmId: string) =>
        change(filmId, { type: 'markUnwatched' }),
      rate: (filmId: string, rating: number) =>
        change(filmId, { type: 'rate', rating }),
      clearRating: (filmId: string) => change(filmId, { type: 'clearRating' }),
      favorite: (filmId: string) => change(filmId, { type: 'favorite' }),
      unfavorite: (filmId: string) => change(filmId, { type: 'unfavorite' }),
      dismiss: (filmId: string) => change(filmId, { type: 'dismiss' }),

      /** Any single action by name; what the API and the client's hook use. */
      change,

      /** Apply one action to many entries already in the Library, atomically. */
      async apply(action: BulkAction, filmIds: string[]) {
        const ids = [...new Set(filmIds)]
        return db.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT id FROM "WatchListItem" WHERE "userId" = ${memberId} AND "movieId" = ANY(${ids}) FOR UPDATE`
          const rows = await tx.watchListItem.findMany({
            where: { userId: memberId, movieId: { in: ids } },
          })
          const changes: EntryChange[] = []
          for (const row of rows) {
            const flags = applyRules(flagsOf(row), { type: action })
            const saved = await tx.watchListItem.update({
              where: { id: row.id },
              data: columns(
                flags,
                action === 'save' ? new Date() : row.savedAt
              ),
            })
            changes.push({
              filmId: row.movieId,
              previous: stateOf(row),
              entry: indexOf(saved),
            })
          }
          return changes
        })
      },

      /** Put an entry back exactly as an earlier action found it. */
      async restore(
        filmId: string,
        previous: EntryState
      ): Promise<EntryChange> {
        if (previous === null) {
          return db.$transaction(async (tx) => {
            await lock(tx, filmId)
            const row = await tx.watchListItem.findUnique({
              where: key(filmId),
            })
            if (!row) return { filmId, previous: null, entry: null }
            const viewings = await tx.watchEvent.count({
              where: { userId: memberId, movieId: filmId },
            })
            if (!viewings) {
              await tx.watchListItem.delete({ where: { id: row.id } })
              return { filmId, previous: stateOf(row), entry: null }
            }
            // A Viewing logged since then keeps the Film watched
            const saved = await tx.watchListItem.update({
              where: { id: row.id },
              data: columns({ ...NO_ENTRY, watched: true }, null),
            })
            return { filmId, previous: stateOf(row), entry: indexOf(saved) }
          })
        }
        const { savedAt, ...flags } = previous
        const result = await write(filmId, async (_current, tx) => {
          // Undo never breaks the rules: a Film with Viewings, a Rating or a
          // Favorite stays Watched, whatever the earlier state said.
          const viewings = await tx.watchEvent.count({
            where: { userId: memberId, movieId: filmId },
          })
          const watched =
            flags.watched ||
            !!viewings ||
            flags.rating != null ||
            flags.favorite
          return { flags: { ...flags, watched }, savedAt }
        })
        return { filmId, previous: result.previous, entry: indexOf(result.row) }
      },

      /* ----------------------------- viewings ---------------------------- */

      /**
       * Record a Viewing. The Film becomes Watched and leaves the Watchlist;
       * with `useRating`, the Viewing's rating becomes the Film's Rating.
       */
      async logViewing(
        filmId: string,
        viewing: ViewingInput,
        { useRating = true }: { useRating?: boolean } = {}
      ) {
        let created: Awaited<ReturnType<typeof db.watchEvent.create>> | null =
          null
        const action: EntryAction = {
          type: 'logViewing',
          rating: viewing.rating,
          useRating,
        }
        const { previous, row } = await write(
          filmId,
          async (current) => ({
            flags: applyRules(current ? flagsOf(current) : null, action),
            savedAt: current?.savedAt ?? null,
          }),
          async (tx, entry) => {
            created = await tx.watchEvent.create({
              data: {
                userId: memberId,
                ...viewingSnapshot(entry),
                ...viewing,
                review: viewing.review || null,
              },
            })
            await refreshLastWatch(tx, filmId)
          }
        )
        return {
          filmId,
          previous,
          entry: indexOf(row),
          viewing: created!,
        }
      },

      /** Change a Viewing's details. The Film's own Rating is left alone. */
      async editViewing(id: string, viewing: ViewingInput) {
        const existing = await db.watchEvent.findFirst({
          where: { id, userId: memberId },
        })
        if (!existing)
          throw new LibraryError('VIEWING_NOT_FOUND', 'Diary entry not found.')
        return db.$transaction(async (tx) => {
          const updated = await tx.watchEvent.update({
            where: { id: existing.id },
            data: { ...viewing, review: viewing.review || null },
          })
          await refreshLastWatch(tx, existing.movieId)
          return updated
        })
      },

      /** Remove a Viewing. The Film stays Watched. */
      async deleteViewing(id: string) {
        return db.$transaction(async (tx) => {
          const existing = await tx.watchEvent.findFirst({
            where: { id, userId: memberId },
          })
          if (!existing)
            throw new LibraryError(
              'VIEWING_NOT_FOUND',
              'Diary entry not found.'
            )
          await tx.watchEvent.delete({ where: { id: existing.id } })
          await refreshLastWatch(tx, existing.movieId)
          return { filmId: existing.movieId }
        })
      },

      /**
       * Bring in a Film from another service's export. Films already in the
       * Library are left untouched. A rating or a watch date makes the Film
       * Watched; a watch date also records a private Viewing.
       */
      async importFilm(
        filmId: string,
        { rating, watchedAt }: { rating: number | null; watchedAt: Date | null }
      ) {
        if (await db.watchListItem.findUnique({ where: key(filmId) }))
          return { added: false }
        const film = await requireFilm(filmId)
        const flags =
          rating != null || watchedAt
            ? applyRules(null, { type: 'logViewing', rating, useRating: true })
            : applyRules(null, { type: 'save' })
        const snapshot = entrySnapshot(film)
        return db.$transaction(async (tx) => {
          const result = await tx.watchListItem.createMany({
            data: [
              {
                ...snapshot,
                userId: memberId,
                ...columns(flags, flags.inWatchlist ? new Date() : null),
                lastWatchedAt: watchedAt,
              },
            ],
            skipDuplicates: true,
          })
          if (result.count && watchedAt)
            await tx.watchEvent.create({
              data: {
                userId: memberId,
                ...viewingSnapshot(snapshot),
                rating,
                watchedAt,
                isPublic: false,
              },
            })
          return { added: result.count === 1 }
        })
      },
    }
  }

  return { forMember }
}

export type Library = ReturnType<typeof createLibrary>
export type MemberLibrary = ReturnType<Library['forMember']>
