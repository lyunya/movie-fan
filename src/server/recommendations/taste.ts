/**
 * A Member's taste, as a weight per genre, read from their Library.
 *
 *   - Loved Films (a Favorite, or rated 4–5 stars) count most.
 *   - Other Watched Films and Films saved to the Watchlist count a little.
 *   - Films rated 1–2 stars count against their genres.
 *   - Dismissed Films say nothing about taste; they're only kept out of
 *     suggestions.
 */
import type { LibraryEntry } from '@/server/library/types'

export type TasteEntry = Pick<
  LibraryEntry,
  'genres' | 'rating' | 'favorite' | 'watched' | 'inWatchlist' | 'dismissed'
>

export const WEIGHTS = { loved: 3, liked: 1, saved: 1, disliked: -2 } as const

export const isLoved = (e: Pick<TasteEntry, 'favorite' | 'rating'>) =>
  e.favorite || (e.rating ?? 0) >= 4

const weightOf = (e: TasteEntry) => {
  if (e.dismissed) return 0
  if (isLoved(e)) return WEIGHTS.loved
  if (e.rating != null && e.rating <= 2) return WEIGHTS.disliked
  if (e.watched) return WEIGHTS.liked
  if (e.inWatchlist) return WEIGHTS.saved
  return 0
}

/** Genres the Member leans toward, strongest first (positive weights only). */
export function tasteGenres(entries: TasteEntry[]): string[] {
  const weights = new Map<string, number>()
  for (const entry of entries) {
    const weight = weightOf(entry)
    if (!weight) continue
    for (const genre of entry.genres)
      weights.set(genre, (weights.get(genre) ?? 0) + weight)
  }
  return [...weights.entries()]
    .filter(([, weight]) => weight > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([genre]) => genre)
}
