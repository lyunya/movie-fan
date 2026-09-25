import { describe, expect, it } from 'vitest'
import { describeScore } from './score'

const now = new Date('2026-09-24T12:00:00')

describe('describeScore', () => {
  it('prefers a real IMDb rating', () => {
    expect(
      describeScore({ imdbRating: 7.84, imdbVotes: 1200, tmdbScore: 70, now })
        .label
    ).toBe('IMDb 7.8')
  })

  it('shows a TMDB score with enough votes (or unknown votes for old library rows)', () => {
    expect(describeScore({ tmdbScore: 79, tmdbVotes: 500, now }).label).toBe(
      'TMDB 79%'
    )
    expect(describeScore({ tmdbScore: 64, now }).label).toBe('TMDB 64%')
  })

  it('never shows 0% — says there are no reviews instead', () => {
    const s = describeScore({
      tmdbScore: 0,
      tmdbVotes: 0,
      releaseDate: '2026-01-01',
      now,
    })
    expect(s).toEqual({ kind: 'none', label: 'No reviews yet', count: null })
    expect(describeScore({ tmdbScore: null, now }).label).toBe('No reviews yet')
    expect(describeScore({ imdbRating: 0, imdbVotes: 0, now }).kind).toBe(
      'none'
    )
  })

  it('calls out unreleased films', () => {
    expect(
      describeScore({
        tmdbScore: 0,
        tmdbVotes: 0,
        releaseDate: '2026-12-18',
        now,
      }).label
    ).toBe('Not out yet')
    // Even a handful of early festival votes shouldn't read as a verdict
    expect(
      describeScore({
        tmdbScore: 93,
        tmdbVotes: 3,
        releaseDate: '2027-03-01',
        now,
      }).label
    ).toBe('Not out yet')
  })

  it('hides noisy scores from a handful of votes', () => {
    expect(
      describeScore({
        tmdbScore: 93,
        tmdbVotes: 3,
        releaseDate: '2025-05-01',
        now,
      }).label
    ).toBe('Too few reviews')
  })
})
