/**
 * The Library's vocabulary. Type-only, so client code can import it.
 * Films are keyed by `filmId` (the Catalog's id); the database layer maps it
 * to the older `movieId` columns.
 */
import type { EntryFlags } from './rules'

export type {
  EntryAction,
  EntryActionType,
  EntryChangeAction,
  EntryFlags,
} from './rules'

/** One Film's place in a Member's Library: the lightweight index row. */
export interface IndexEntry extends EntryFlags {
  filmId: string
}

/**
 * Everything needed to put an entry back exactly as it was. `null` means the
 * Film wasn't in the Library at all.
 */
export type EntryState = (EntryFlags & { savedAt: Date | null }) | null

/** The result of every entry action: what it was, and what it is now. */
export interface EntryChange {
  filmId: string
  previous: EntryState
  entry: IndexEntry | null
}

/** A full Library entry, with the Film snapshot the Library page shows. */
export interface LibraryEntry extends IndexEntry {
  title: string
  /** TMDB path, or a full URL on entries saved before paths were stored */
  posterPath: string | null
  releaseDate: string | null
  runtime: number | null
  genres: string[]
  directedBy: string | null
  /** TMDB score, 0–100, when the Film was saved */
  tmdbPercent: number | null
  certification: string | null
  savedAt: Date | null
  lastWatchedAt: Date | null
  updatedAt: Date
}

/** What a Member records about one Viewing. */
export interface ViewingInput {
  watchedAt: Date
  rating: number | null
  review: string | null
  tags: string[]
  isPublic: boolean
  spoiler: boolean
}

/** Bulk actions offered on the Library page. */
export type BulkAction = 'save' | 'unsave' | 'markWatched'
