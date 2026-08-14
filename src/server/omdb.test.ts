import { describe, expect, it } from 'vitest'
import { parseImdbRating } from '@/utils/imdbRating'

describe('parseImdbRating', () => {
  it('parses a valid IMDb score and comma-separated vote count', () => {
    expect(
      parseImdbRating({
        Response: 'True',
        imdbRating: '8.7',
        imdbVotes: '2,345,678',
      })
    ).toEqual({ rating: 8.7, voteCount: 2_345_678 })
  })

  it('returns null when OMDb has no usable IMDb score', () => {
    expect(parseImdbRating({ Response: 'False', imdbRating: 'N/A' })).toBeNull()
  })
})
