import { describe, expect, it } from 'vitest'
import { applyRules, NO_ENTRY, type EntryFlags } from './rules'

const saved: EntryFlags = { ...NO_ENTRY, inWatchlist: true }

describe('Library rules', () => {
  it('watching a Film takes it off the Watchlist, however it happens', () => {
    for (const action of [
      { type: 'markWatched' as const },
      { type: 'rate' as const, rating: 4 },
      { type: 'favorite' as const },
      { type: 'logViewing' as const, rating: null, useRating: true },
    ]) {
      expect(applyRules(saved, action)).toMatchObject({
        watched: true,
        inWatchlist: false,
      })
    }
  })

  it('saving a Watched Film puts it back on the Watchlist for a rewatch', () => {
    const watched = applyRules(saved, { type: 'rate', rating: 5 })
    expect(applyRules(watched, { type: 'save' })).toEqual({
      ...NO_ENTRY,
      watched: true,
      inWatchlist: true,
      rating: 5,
    })
  })

  it('un-watching clears the Rating and Favorite that depend on it', () => {
    const loved = applyRules(applyRules(null, { type: 'favorite' }), {
      type: 'rate',
      rating: 5,
    })
    expect(applyRules(loved, { type: 'markUnwatched' })).toEqual(NO_ENTRY)
  })

  it('a Viewing sets the Rating only when asked', () => {
    const rated = applyRules(null, { type: 'rate', rating: 2 })
    expect(
      applyRules(rated, { type: 'logViewing', rating: 5, useRating: false })
        .rating
    ).toBe(2)
    expect(
      applyRules(rated, { type: 'logViewing', rating: 5, useRating: true })
        .rating
    ).toBe(5)
    expect(
      applyRules(rated, { type: 'logViewing', rating: null, useRating: true })
        .rating
    ).toBe(2)
  })

  it('dismissing only affects suggestions', () => {
    expect(applyRules(saved, { type: 'dismiss' })).toEqual({
      ...saved,
      dismissed: true,
    })
    expect(
      applyRules({ ...NO_ENTRY, dismissed: true }, { type: 'save' }).dismissed
    ).toBe(false)
  })

  it('clearing a Rating or Favorite keeps the Film watched', () => {
    const loved = applyRules(null, { type: 'favorite' })
    expect(applyRules(loved, { type: 'unfavorite' })).toMatchObject({
      watched: true,
      favorite: false,
    })
  })
})
