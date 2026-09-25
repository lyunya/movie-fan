/**
 * Choose up to three Tonight picks from a pool that already satisfies the
 * Member's filters. Roles change which films are chosen, never which are
 * eligible:
 *
 *   1. Best fit: a Watchlist film if the pool has one ("From your
 *      watchlist"), else the film that best matches their taste.
 *   2. Familiar territory: another film in genres they love.
 *   3. A different flavor: the film furthest from their usual genres.
 *   Any gaps are filled with the next most popular matches.
 */
import type { Film } from '@/server/catalog/types'
import { tmdbPercent } from '@/utils/film'

type Candidate = Pick<Film, 'id' | 'tmdb' | 'genreIds'>

export interface TonightPick<T> {
  film: T
  role: string
  reason: string
}

export function selectTonightPicks<T extends Candidate>(
  pool: T[],
  preferredGenres: number[],
  watchlist: ReadonlySet<string> = new Set()
): TonightPick<T>[] {
  const score = (m: T) => tmdbPercent(m) || 0
  const overlap = (film: T, genres: number[]) =>
    film.genreIds.filter((id) => genres.includes(id)).length
  const fit = (m: T) => overlap(m, preferredGenres) * 30 + score(m)
  const byFit = (a: T, b: T) => fit(b) - fit(a)
  const remaining = [...pool]
  const picks: TonightPick<T>[] = []
  const take = (film: T, role: string, reason: string) => {
    picks.push({ film, role, reason })
    remaining.splice(remaining.indexOf(film), 1)
  }

  const saved = remaining.filter((m) => watchlist.has(m.id)).sort(byFit)[0]
  const best = saved ?? [...remaining].sort(byFit)[0]
  if (!best) return picks
  take(
    best,
    saved
      ? 'From your watchlist'
      : preferredGenres.length
        ? 'Best fit'
        : 'Highly rated',
    saved
      ? 'You saved this one for a night like tonight'
      : preferredGenres.length && overlap(best, preferredGenres)
        ? 'Shares genres with films you love'
        : 'One of the highest TMDB scores in this matching pool'
  )

  const familiar = remaining
    .filter((m) => overlap(m, preferredGenres) > 0)
    .sort(byFit)[0]
  if (familiar)
    take(familiar, 'Familiar territory', 'More from genres you love')

  const reference = preferredGenres.length ? preferredGenres : best.genreIds
  const wildcard = remaining
    .filter((m) => m.genreIds.some((id) => !reference.includes(id)))
    .sort(
      (a, b) =>
        overlap(a, reference) - overlap(b, reference) || score(b) - score(a)
    )[0]
  if (wildcard)
    take(
      wildcard,
      'A different flavor',
      preferredGenres.length
        ? 'Explores beyond your usual genre mix'
        : 'A different genre mix from the first pick'
    )

  for (const film of [...remaining]) {
    if (picks.length >= 3) break
    take(film, 'Another good match', 'Popular in this matching pool')
  }
  return picks
}
