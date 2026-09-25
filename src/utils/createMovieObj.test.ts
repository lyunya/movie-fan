import { describe, it, expect } from 'vitest'
import type { FilmDetail } from '@/server/catalog/types'
import { createMovieObj } from './createMovieObj'

const film = (over: Partial<FilmDetail> = {}): FilmDetail => ({
  id: '10',
  title: 'Movie',
  releaseDate: '2020-01-01',
  posterPath: '/p.jpg',
  backdropPath: null,
  genreIds: [28],
  tmdb: { average: 7.5, votes: 10 },
  imdb: null,
  tagline: null,
  overview: 'A synopsis',
  runtime: 100,
  genres: [{ id: 28, name: 'Action' }],
  certification: 'PG-13',
  directors: [{ personId: 1, name: 'Dir' }],
  revenue: 1_234_567,
  trailerKey: null,
  stills: [],
  cast: [],
  crew: [],
  whereToWatch: null,
  similar: [],
  ...over,
})

describe('createMovieObj', () => {
  it('maps a film into a Library snapshot', () => {
    const obj = createMovieObj(film(), 4)
    expect(obj).toMatchObject({
      movieId: '10',
      name: 'Movie',
      posterImage: 'https://image.tmdb.org/t/p/w500/p.jpg',
      userRating: 4,
      genres: ['Action'],
      directedBy: 'Dir',
      tomatoMeter: 75,
      totalGross: '$1,234,567',
      motionPictureRating: 'PG-13',
    })
  })

  it('defaults rating to null and rating code to "Not Rated"', () => {
    const obj = createMovieObj(film({ certification: null }))
    expect(obj.userRating).toBeNull()
    expect(obj.motionPictureRating).toBe('Not Rated')
  })

  it('falls back to an empty poster when missing', () => {
    expect(createMovieObj(film({ posterPath: null })).posterImage).toBe('')
  })
})
