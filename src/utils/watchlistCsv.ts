import type { WatchListItem } from '@prisma/client'

/** Portable movie columns; dates are included only when a viewing is known. */
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
    return [
      movie.name,
      year,
      rating10,
      movie.lastWatchedAt?.toISOString().slice(0, 10) || '',
      movie.movieId,
    ]
      .map((cell) => escapeCell(String(cell)))
      .join(',')
  })
  return [WATCHLIST_CSV_HEADERS.join(','), ...rows].join('\n')
}
