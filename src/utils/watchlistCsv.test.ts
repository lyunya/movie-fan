import { describe, it, expect } from 'vitest'
import type { WatchListItem } from '@prisma/client'
import { toWatchlistCsv, WATCHLIST_CSV_HEADERS } from './watchlistCsv'

const row = (over: Partial<WatchListItem>): WatchListItem => ({
  id: 'x',
  userId: 'u',
  movieId: '1',
  directedBy: '',
  durationMinutes: 0,
  name: 'A',
  emsVersionId: '1',
  posterImage: null,
  genres: [],
  synopsis: null,
  tomatoMeter: null,
  consensus: null,
  totalGross: null,
  releaseDate: null,
  motionPictureRating: null,
  userRating: null,
  hasStreaming: false,
  ...over,
})

describe('toWatchlistCsv', () => {
  it('emits just the header row for an empty list', () => {
    expect(toWatchlistCsv([])).toBe(WATCHLIST_CSV_HEADERS.join(','))
  })

  it('doubles the star rating onto the 0–10 scale', () => {
    const csv = toWatchlistCsv([
      row({ name: 'Heat', releaseDate: '1995-12-15', userRating: 4, movieId: '949' }),
    ])
    expect(csv.split('\n')[1]).toBe('Heat,1995,8,,949')
  })

  it('leaves the rating blank when unrated', () => {
    const csv = toWatchlistCsv([
      row({ name: 'Dune', releaseDate: '2021-10-22', movieId: '438631' }),
    ])
    expect(csv.split('\n')[1]).toBe('Dune,2021,,,438631')
  })

  it('escapes commas and quotes in titles', () => {
    const csv = toWatchlistCsv([
      row({ name: 'Good, Bad "Ugly"', releaseDate: '1966', movieId: '429' }),
    ])
    expect(csv.split('\n')[1]).toBe('"Good, Bad ""Ugly""",1966,,,429')
  })
})
