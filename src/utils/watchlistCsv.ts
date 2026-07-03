import type { WatchListItem } from '@prisma/client'

/**
 * Letterboxd-compatible import columns. WatchedDate is left blank (the app
 * doesn't track it) but kept so the file drops straight into Letterboxd's
 * importer; Rating10 is the 1–5 star score doubled onto Letterboxd's 0–10.
 */
export const WATCHLIST_CSV_HEADERS = [
  'Title',
  'Year',
  'Rating10',
  'WatchedDate',
  'tmdbID',
] as const

const escapeCell = (value: string): string =>
  /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value

/** Serialize watchlist rows into a Letterboxd-importable CSV string. */
export const toWatchlistCsv = (movies: WatchListItem[]): string => {
  const rows = movies.map((movie) => {
    const year = movie.releaseDate ? String(movie.releaseDate).slice(0, 4) : ''
    const rating10 = movie.userRating ? String(movie.userRating * 2) : ''
    return [movie.name, year, rating10, '', movie.movieId]
      .map((cell) => escapeCell(String(cell)))
      .join(',')
  })
  return [WATCHLIST_CSV_HEADERS.join(','), ...rows].join('\n')
}
