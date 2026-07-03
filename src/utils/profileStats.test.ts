import { describe, it, expect } from 'vitest'
import type { WatchListItem } from '@prisma/client'
import { computeTasteStats } from './profileStats'

const row = (over: Partial<WatchListItem>): WatchListItem => ({
  id: 'x',
  userId: 'u',
  movieId: Math.random().toString(),
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

describe('computeTasteStats', () => {
  it('counts genres across everything saved, most-common first', () => {
    const stats = computeTasteStats([
      row({ genres: ['Action', 'Drama'] }),
      row({ genres: ['Action'] }),
    ])
    expect(stats.topGenres[0]).toEqual(['Action', 2])
  })

  it('scales stars onto 0–100 and computes the delta vs critics', () => {
    const stats = computeTasteStats([
      row({ userRating: 5, tomatoMeter: 80, durationMinutes: 120 }),
      row({ userRating: 4, tomatoMeter: 60, durationMinutes: 90 }),
    ])
    expect(stats.yourAvg).toBe(90) // (4.5 avg) * 20
    expect(stats.criticsAvg).toBe(70)
    expect(stats.delta).toBe(20)
    expect(stats.minutesWatched).toBe(210)
    expect(stats.ratedCount).toBe(2)
  })

  it('builds the 1–5 star histogram at indices 0–4', () => {
    const stats = computeTasteStats([
      row({ userRating: 5 }),
      row({ userRating: 5 }),
      row({ userRating: 3 }),
    ])
    expect(stats.ratingCounts).toEqual([0, 0, 1, 0, 2])
  })

  it('buckets decades by release year of rated movies', () => {
    const stats = computeTasteStats([
      row({ userRating: 4, releaseDate: '1994-09-10' }),
      row({ userRating: 5, releaseDate: '1999-03-31' }),
      row({ userRating: 3, releaseDate: '2008-07-18' }),
    ])
    expect(stats.topDecades[0]).toEqual([1990, 2])
  })

  it('ignores unrated movies for hours watched and ratings', () => {
    const stats = computeTasteStats([row({ durationMinutes: 100 })])
    expect(stats.minutesWatched).toBe(0)
    expect(stats.ratedCount).toBe(0)
    expect(stats.yourAvg).toBeNull()
  })
})
