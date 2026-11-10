import { describe, expect, it } from 'vitest'
import { publicCacheSeconds } from './publicReads'

describe('publicCacheSeconds', () => {
  it('caches a request made only of public catalog reads, for the shortest lifetime', () => {
    expect(publicCacheSeconds(['catalog.providers'])).toBe(86400)
    expect(publicCacheSeconds(['catalog.providers', 'catalog.search'])).toBe(
      3600
    )
  })

  it('never caches a batch that includes anything personal or unknown', () => {
    expect(publicCacheSeconds([])).toBeNull()
    expect(publicCacheSeconds(['library.index'])).toBeNull()
    expect(publicCacheSeconds(['catalog.search', 'catalog.tonight'])).toBeNull()
    expect(publicCacheSeconds(['catalog.search', 'catalog.forYou'])).toBeNull()
  })
})
