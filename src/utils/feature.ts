/**
 * Tonight's feature: one of the most popular films with artwork, a different
 * one each day and the same one for everybody on that day. Days are UTC, so
 * the feature changes at the same moment everywhere.
 */
export const FEATURE_POOL = 10

const DAY_MS = 86_400_000

/** The day's candidates, tonight's pick first, then the rest in rotation order. */
export function featureCandidates<
  T extends { posterPath: string | null; backdropPath: string | null },
>(popular: readonly T[], now: Date = new Date()): T[] {
  const pool = popular
    .filter((film) => film.backdropPath && film.posterPath)
    .slice(0, FEATURE_POOL)
  if (!pool.length) return []
  const start = Math.floor(now.getTime() / DAY_MS) % pool.length
  return [...pool.slice(start), ...pool.slice(0, start)]
}
