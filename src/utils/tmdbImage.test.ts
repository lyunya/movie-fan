import { describe, expect, it } from 'vitest'
import { tmdbImage } from './tmdbImage'

describe('tmdbImage', () => {
  it('swaps the rendition segment of a TMDB url', () => {
    expect(tmdbImage('https://image.tmdb.org/t/p/w500/abc.jpg', 'w342')).toBe(
      'https://image.tmdb.org/t/p/w342/abc.jpg'
    )
    expect(
      tmdbImage('https://image.tmdb.org/t/p/original/x.jpg', 'w1280')
    ).toBe('https://image.tmdb.org/t/p/w1280/x.jpg')
  })

  it('leaves local and foreign urls alone', () => {
    expect(tmdbImage('/placeholderposter.svg', 'w185')).toBe(
      '/placeholderposter.svg'
    )
    expect(tmdbImage('https://example.com/t/p/w500/a.jpg', 'w92')).toBe(
      'https://example.com/t/p/w500/a.jpg'
    )
  })

  it('passes through empty values', () => {
    expect(tmdbImage(null, 'w342')).toBeNull()
    expect(tmdbImage('', 'w342')).toBe('')
  })
})
