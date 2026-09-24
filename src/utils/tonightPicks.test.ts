import { describe, it, expect } from 'vitest'
import { selectTonightPicks } from './tonightPicks'
const pool = [
  { emsVersionId: 'a', tomatoMeter: 80, genreIds: [18] },
  { emsVersionId: 'b', tomatoMeter: 75, genreIds: [18] },
  { emsVersionId: 'c', tomatoMeter: 70, genreIds: [35] },
  { emsVersionId: 'd', tomatoMeter: 95, genreIds: [18] },
]
describe('Tonight roles', () => {
  it('selects taste-based, familiar and exploratory candidates without duplicates', () => {
    const picks = selectTonightPicks(pool, [18])
    expect(picks.map((p) => p.movie.emsVersionId)).toEqual(['d', 'a', 'c'])
    expect(picks.map((p) => p.role)).toEqual([
      'Best fit',
      'Familiar territory',
      'A different flavor',
    ])
  })
  it('avoids claiming personal taste for guests and handles short pools', () => {
    expect(selectTonightPicks(pool.slice(0, 1), [])[0]?.role).toBe(
      'Highly rated'
    )
    expect(selectTonightPicks([], [])).toEqual([])
  })
})
