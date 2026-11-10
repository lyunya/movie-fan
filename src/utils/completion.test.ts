import { describe, expect, it } from 'vitest'
import { filmographyCompletion } from './completion'

const credits = [
  { filmId: '1', year: '1999', role: 'Directing' },
  { filmId: '1', year: '1999', role: 'Acting' },
  { filmId: '2', year: '2004', role: 'Directing' },
  { filmId: '3', year: '2010', role: 'Acting' },
  { filmId: '4', year: null, role: 'Directing' }, // announced, undated
]

describe('filmographyCompletion', () => {
  it('counts each film once overall, and per role', () => {
    const result = filmographyCompletion(credits, new Set(['1', '3', '99']))
    expect(result.all).toEqual({ seen: 2, total: 3, percent: 67 })
    expect(result.byRole.Directing).toEqual({ seen: 1, total: 2, percent: 50 })
    expect(result.byRole.Acting).toEqual({ seen: 2, total: 2, percent: 100 })
  })

  it('leaves undated credits out, so 100% is reachable', () => {
    expect(
      filmographyCompletion(credits, new Set(['1', '2', '3'])).all
    ).toEqual({ seen: 3, total: 3, percent: 100 })
  })

  it('handles an empty filmography', () => {
    expect(filmographyCompletion([], new Set()).all).toEqual({
      seen: 0,
      total: 0,
      percent: 0,
    })
  })
})
