import type { WatchListItem } from '@prisma/client'

/**
 * Pure aggregation behind the profile "Your taste" dashboard. Kept out of the
 * component so it can be unit-tested without rendering. Stars are 1–5; TMDB
 * scores are 0–100, and yourAvg scales stars onto the same 0–100 axis.
 */
export const MAX_GENRE_BARS = 6

export interface TasteStats {
  ratedCount: number
  minutesWatched: number
  topGenres: [string, number][]
  otherGenreCount: number
  maxGenreCount: number
  yourAvg: number | null
  criticsAvg: number | null
  delta: number | null
  comparableCount: number
  topDirector: [string, number] | null
  /** Counts for 1..5 stars at indices 0..4 */
  ratingCounts: number[]
  maxRatingCount: number
  topDecades: [number, number][]
  maxDecadeCount: number
}

export const computeTasteStats = (movies: WatchListItem[]): TasteStats => {
  const rated = movies.filter((movie) => movie.userRating)

  // Favorite genres across everything saved
  const genreCounts = new Map<string, number>()
  for (const movie of movies) {
    for (const genre of movie.genres || []) {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1)
    }
  }
  const rankedGenres = [...genreCounts.entries()].sort((a, b) => b[1] - a[1])
  const topGenres = rankedGenres.slice(0, MAX_GENRE_BARS)
  const otherGenreCount = rankedGenres
    .slice(MAX_GENRE_BARS)
    .reduce((sum, [, count]) => sum + count, 0)
  const maxGenreCount = topGenres[0]?.[1] ?? 0

  // Hours watched: runtimes of everything rated as seen
  const minutesWatched = rated.reduce(
    (sum, movie) => sum + (movie.durationMinutes || 0),
    0
  )

  // You vs the critics — both on a 0–100 scale (stars are 1–5)
  const comparable = rated.filter((movie) => movie.tomatoMeter != null)
  const yourAvg =
    comparable.length > 0
      ? Math.round(
          (comparable.reduce((sum, movie) => sum + (movie.userRating || 0), 0) /
            comparable.length) *
            20
        )
      : null
  const criticsAvg =
    comparable.length > 0
      ? Math.round(
          comparable.reduce((sum, movie) => sum + (movie.tomatoMeter || 0), 0) /
            comparable.length
        )
      : null
  const delta =
    yourAvg != null && criticsAvg != null ? yourAvg - criticsAvg : null

  // Most-watched director among rated movies
  const directorCounts = new Map<string, number>()
  for (const movie of rated) {
    const director = movie.directedBy?.trim()
    if (director) {
      directorCounts.set(director, (directorCounts.get(director) || 0) + 1)
    }
  }
  const topDirector =
    [...directorCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null

  // Star-rating distribution (1–5) across rated movies
  const ratingCounts = [1, 2, 3, 4, 5].map(
    (star) => rated.filter((movie) => movie.userRating === star).length
  )
  const maxRatingCount = Math.max(...ratingCounts, 0)

  // Which decades the user actually watches, by release year of rated movies
  const decadeCounts = new Map<number, number>()
  for (const movie of rated) {
    const year = movie.releaseDate
      ? Number(String(movie.releaseDate).slice(0, 4))
      : NaN
    if (!Number.isNaN(year) && year > 1900) {
      const decade = Math.floor(year / 10) * 10
      decadeCounts.set(decade, (decadeCounts.get(decade) || 0) + 1)
    }
  }
  const topDecades = [...decadeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxDecadeCount = topDecades[0]?.[1] ?? 0

  return {
    ratedCount: rated.length,
    minutesWatched,
    topGenres,
    otherGenreCount,
    maxGenreCount,
    yourAvg,
    criticsAvg,
    delta,
    comparableCount: comparable.length,
    topDirector,
    ratingCounts,
    maxRatingCount,
    topDecades,
    maxDecadeCount,
  }
}
