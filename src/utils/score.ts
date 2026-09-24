/**
 * One place that decides what "score" a film shows. TMDB reports 0% (or a
 * wildly noisy number) for films nobody has rated yet — usually because they
 * aren't out — so a raw `TMDB 0%` reads like a verdict when it's really an
 * absence. This returns either a real score or an honest "no reviews" label.
 */
export const MIN_TMDB_VOTES = 10

export type ScoreDisplay =
  | { kind: 'imdb' | 'tmdb'; label: string; count: number | null }
  | { kind: 'none'; label: string; count: null }

export function describeScore({
  tmdbScore,
  tmdbVotes,
  imdbRating,
  imdbVotes,
  releaseDate,
  now = new Date(),
}: {
  tmdbScore?: number | null
  /** Unknown (null/undefined) for library rows saved before vote counts */
  tmdbVotes?: number | null
  imdbRating?: number | null
  imdbVotes?: number | null
  releaseDate?: string | null
  now?: Date
}): ScoreDisplay {
  if (imdbRating != null && imdbRating > 0 && imdbVotes !== 0)
    return {
      kind: 'imdb',
      label: `IMDb ${imdbRating.toFixed(1)}`,
      count: imdbVotes ?? null,
    }
  const votesKnown = tmdbVotes != null
  if (
    tmdbScore != null &&
    tmdbScore > 0 &&
    (!votesKnown || tmdbVotes >= MIN_TMDB_VOTES)
  )
    return {
      kind: 'tmdb',
      label: `TMDB ${tmdbScore}%`,
      count: tmdbVotes ?? null,
    }

  const release = releaseDate
    ? new Date(`${releaseDate.slice(0, 10)}T00:00:00`)
    : null
  if (release && !Number.isNaN(release.getTime()) && release > now)
    return { kind: 'none', label: 'Not out yet', count: null }
  if (votesKnown && tmdbVotes > 0 && tmdbScore)
    return { kind: 'none', label: 'Too few reviews', count: null }
  return { kind: 'none', label: 'No reviews yet', count: null }
}
