/**
 * The Library's rules, as one pure function: given a Library entry's flags
 * and an action, what are the flags afterwards?
 *
 * Client-safe on purpose. The server applies these rules when it writes, and
 * the client applies the same rules to its cached index for instant (then
 * confirmed) updates, so the two can never disagree about what a tap means.
 *
 *   - Watching a Film (marking it, rating it, favoriting it, or logging a
 *     Viewing) makes it Watched and takes it off the Watchlist.
 *   - Saving a Watched Film puts it back on the Watchlist for a rewatch.
 *   - A Rating or a Favorite only exists on a Watched Film, so un-watching
 *     clears both.
 *   - Dismissing only affects suggestions; it never touches the Watchlist.
 */

export interface EntryFlags {
  inWatchlist: boolean
  watched: boolean
  favorite: boolean
  dismissed: boolean
  /** 1–5 stars, or null when unrated */
  rating: number | null
}

export type EntryAction =
  | { type: 'save' }
  | { type: 'unsave' }
  | { type: 'markWatched' }
  | { type: 'markUnwatched' }
  | { type: 'rate'; rating: number }
  | { type: 'clearRating' }
  | { type: 'favorite' }
  | { type: 'unfavorite' }
  | { type: 'dismiss' }
  | { type: 'logViewing'; rating: number | null; useRating: boolean }

export type EntryActionType = EntryAction['type']

/** The actions a Member takes directly on an entry (a Viewing has its own form). */
export type EntryChangeAction = Exclude<EntryAction, { type: 'logViewing' }>

/** A Film that isn't in the Library yet. */
export const NO_ENTRY: EntryFlags = {
  inWatchlist: false,
  watched: false,
  favorite: false,
  dismissed: false,
  rating: null,
}

const watch = (f: EntryFlags): EntryFlags => ({
  ...f,
  watched: true,
  inWatchlist: false,
})

export function applyRules(
  current: EntryFlags | null,
  action: EntryAction
): EntryFlags {
  const f = current ?? NO_ENTRY
  switch (action.type) {
    case 'save':
      return { ...f, inWatchlist: true, dismissed: false }
    case 'unsave':
      return { ...f, inWatchlist: false }
    case 'markWatched':
      return watch(f)
    case 'markUnwatched':
      return { ...f, watched: false, rating: null, favorite: false }
    case 'rate':
      return { ...watch(f), rating: action.rating }
    case 'clearRating':
      return { ...f, rating: null }
    case 'favorite':
      return { ...watch(f), favorite: true }
    case 'unfavorite':
      return { ...f, favorite: false }
    case 'dismiss':
      return { ...f, dismissed: true }
    case 'logViewing':
      return action.useRating && action.rating != null
        ? { ...watch(f), rating: action.rating }
        : watch(f)
  }
}

/** Actions that only change an existing entry; on a missing one they do nothing. */
export const needsEntry = (action: EntryAction) =>
  action.type === 'unsave' ||
  action.type === 'clearRating' ||
  action.type === 'unfavorite' ||
  action.type === 'markUnwatched'
