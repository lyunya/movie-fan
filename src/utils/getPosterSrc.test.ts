import { describe, it, expect } from 'vitest'
import { getPosterSrc } from './getPosterSrc'

const PLACEHOLDER = '/placeholderposter.png'

describe('getPosterSrc', () => {
  it('returns a string url as-is', () => {
    expect(getPosterSrc('http://x/p.png')).toBe('http://x/p.png')
  })
  it('reads the url off an object', () => {
    expect(getPosterSrc({ url: 'http://x/p.png' })).toBe('http://x/p.png')
  })
  it('falls back to the placeholder for empty/missing values', () => {
    expect(getPosterSrc(null)).toBe(PLACEHOLDER)
    expect(getPosterSrc(undefined)).toBe(PLACEHOLDER)
    expect(getPosterSrc('')).toBe(PLACEHOLDER)
    expect(getPosterSrc({ url: '' })).toBe(PLACEHOLDER)
  })
})
