import { describe, it, expect } from 'vitest'
import type { IMovieDetail } from '@/components/MovieDetails/types'
import { createMovieObj } from './createMovieObj'

const movie = (over: Partial<IMovieDetail> = {}): IMovieDetail => ({
  emsVersionId: '10',
  id: '10',
  name: 'Movie',
  synopsis: 'A synopsis',
  genres: [{ name: 'Action' }],
  posterImage: { url: 'http://x/p.png' },
  backgroundImage: { url: null },
  releaseDate: '2020-01-01',
  durationMinutes: 100,
  directedBy: 'Dir',
  totalGross: null,
  motionPictureRating: { code: 'PG-13' },
  tomatoMeter: 75,
  voteCount: 10,
  consensus: null,
  trailer: { url: null },
  images: [],
  cast: [],
  crew: [],
  watchProviders: null,
  similar: [],
  ...over,
})

describe('createMovieObj', () => {
  it('maps movie details into a watchlist row', () => {
    const obj = createMovieObj(movie(), '10', ['Action'], 4)
    expect(obj.movieId).toBe('10')
    expect(obj.posterImage).toBe('http://x/p.png')
    expect(obj.userRating).toBe(4)
    expect(obj.genres).toEqual(['Action'])
    expect(obj.motionPictureRating).toBe('PG-13')
  })

  it('defaults rating to null and rating code to "Not Rated"', () => {
    const obj = createMovieObj(
      movie({ motionPictureRating: { code: null } }),
      '10',
      []
    )
    expect(obj.userRating).toBeNull()
    expect(obj.motionPictureRating).toBe('Not Rated')
  })

  it('falls back to empty poster when missing', () => {
    const obj = createMovieObj(
      movie({ posterImage: { url: null } }),
      '10',
      ['Action']
    )
    expect(obj.posterImage).toBe('')
  })
})
