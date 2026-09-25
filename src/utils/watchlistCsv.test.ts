import { describe, it, expect } from 'vitest'
import type { LibraryEntry } from '@/server/library/types'
import { toWatchlistCsv, WATCHLIST_CSV_HEADERS } from './watchlistCsv'

const row = (over: Partial<LibraryEntry>): LibraryEntry => ({
  filmId: Math.random().toString(),
  title: 'A',
  posterPath: null,
  releaseDate: null,
  runtime: null,
  genres: [],
  directedBy: null,
  tmdbPercent: null,
  certification: null,
  rating: null,
  inWatchlist: true,
  watched: false,
  favorite: false,
  dismissed: false,
  savedAt: null,
  lastWatchedAt: null,
  updatedAt: new Date(),
  ...over,
})

describe('toWatchlistCsv', () => {
  it('emits just the header row for an empty list', () => {
    expect(toWatchlistCsv([])).toBe(WATCHLIST_CSV_HEADERS.join(','))
  })

  it('doubles the star rating onto the 0–10 scale', () => {
    const csv = toWatchlistCsv([
      row({
        title: 'Heat',
        releaseDate: '1995-12-15',
        rating: 4,
        filmId: '949',
      }),
    ])
    expect(csv.split('\n')[1]).toBe('Heat,1995,8,,949')
  })

  it('leaves the rating blank when unrated', () => {
    const csv = toWatchlistCsv([
      row({ title: 'Dune', releaseDate: '2021-10-22', filmId: '438631' }),
    ])
    expect(csv.split('\n')[1]).toBe('Dune,2021,,,438631')
  })

  it('escapes commas and quotes in titles', () => {
    const csv = toWatchlistCsv([
      row({ title: 'Good, Bad "Ugly"', releaseDate: '1966', filmId: '429' }),
    ])
    expect(csv.split('\n')[1]).toBe('"Good, Bad ""Ugly""",1966,,,429')
  })
})
