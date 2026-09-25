import { describe, expect, it } from 'vitest'
import { filmFromSnapshot, filmImage, filmScore, tmdbPercent } from './film'

describe('filmImage', () => {
  it('sizes TMDB paths and legacy full URLs', () => {
    expect(filmImage('/abc.jpg', 'w342')).toBe(
      'https://image.tmdb.org/t/p/w342/abc.jpg'
    )
    expect(filmImage('https://image.tmdb.org/t/p/w500/abc.jpg', 'w185')).toBe(
      'https://image.tmdb.org/t/p/w185/abc.jpg'
    )
  })
  it('returns null when there is no image', () => {
    expect(filmImage(null, 'w342')).toBeNull()
    expect(filmImage('', 'w342')).toBeNull()
  })
})

describe('scores', () => {
  const now = new Date('2026-09-24T12:00:00')
  it('converts the 0–10 average to a percent', () => {
    expect(tmdbPercent({ tmdb: { average: 7.86, votes: 10 } })).toBe(79)
    expect(tmdbPercent({ tmdb: { average: null, votes: 0 } })).toBeNull()
  })
  it('labels films through the shared score rules', () => {
    expect(
      filmScore(
        { tmdb: { average: 7.9, votes: 500 }, releaseDate: '2020-01-01' },
        now
      ).label
    ).toBe('TMDB 79%')
    expect(
      filmScore(
        { tmdb: { average: null, votes: 0 }, releaseDate: '2026-12-18' },
        now
      ).label
    ).toBe('Not out yet')
  })
})

describe('filmFromSnapshot', () => {
  it('turns a stored snapshot into a Film', () => {
    expect(
      filmFromSnapshot({
        movieId: '603',
        name: 'The Matrix',
        posterImage: 'https://image.tmdb.org/t/p/w500/m.jpg',
        releaseDate: '1999-03-31',
        tomatoMeter: 82,
      })
    ).toEqual({
      id: '603',
      title: 'The Matrix',
      releaseDate: '1999-03-31',
      posterPath: 'https://image.tmdb.org/t/p/w500/m.jpg',
      backdropPath: null,
      genreIds: [],
      tmdb: { average: 8.2, votes: null },
    })
  })
})
