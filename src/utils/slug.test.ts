import { describe, it, expect } from 'vitest'
import { slugify, parseIdFromSlug, toSlug } from './slug'

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Science Fiction')).toBe('science-fiction')
    expect(slugify('  Spaced  Out  ')).toBe('spaced-out')
  })
  it('drops punctuation and trailing separators', () => {
    expect(slugify('Brad Pitt!')).toBe('brad-pitt')
    expect(slugify('Amélie?')).toBe('am-lie')
  })
})

describe('parseIdFromSlug', () => {
  it('extracts the leading id', () => {
    expect(parseIdFromSlug('878-science-fiction')).toBe(878)
    expect(parseIdFromSlug('287-brad-pitt')).toBe(287)
    expect(parseIdFromSlug('5')).toBe(5)
  })
  it('returns null without a leading id', () => {
    expect(parseIdFromSlug('brad-pitt')).toBeNull()
    expect(parseIdFromSlug('')).toBeNull()
  })
  it('decodes encoded slugs', () => {
    expect(parseIdFromSlug(encodeURIComponent('287-brad pitt'))).toBe(287)
  })
})

describe('toSlug', () => {
  it('joins id and name', () => {
    expect(toSlug(878, 'Science Fiction')).toBe('878-science-fiction')
  })
  it('drops an empty name suffix', () => {
    expect(toSlug(5, '')).toBe('5')
  })
  it('round-trips through parseIdFromSlug', () => {
    expect(parseIdFromSlug(toSlug(603, 'The Matrix'))).toBe(603)
  })
})
