/**
 * How alike two Members' taste is, from the Films both have rated.
 *
 * Each shared Film scores by how close the two star Ratings are (same
 * rating = 1, four stars apart = 0); the match is the average, as a
 * percentage. With fewer than MIN_SHARED Films in common there isn't enough
 * to say, and the result is null rather than a misleading number.
 */
export interface RatedFilm {
  filmId: string
  /** 1–5 stars, or null when unrated */
  rating: number | null
}

export const MIN_SHARED = 3

export function tasteMatch(
  mine: readonly RatedFilm[],
  theirs: readonly RatedFilm[]
): { percent: number; shared: number } | null {
  const myRatings = new Map(
    mine.filter((f) => f.rating != null).map((f) => [f.filmId, f.rating!])
  )
  let total = 0
  let shared = 0
  for (const film of theirs) {
    const my = myRatings.get(film.filmId)
    if (my == null || film.rating == null) continue
    total += 1 - Math.abs(my - film.rating) / 4
    shared++
  }
  if (shared < MIN_SHARED) return null
  return { percent: Math.round((total / shared) * 100), shared }
}
