import { describe, it, expect } from 'vitest'
import { selectTonightPicks } from './tonightPicks'
const film = (id: string, percent: number, genreIds: number[]) => ({
  id,
  tmdb: { average: percent / 10, votes: 500 },
  genreIds,
})
const pool = [
  film('a', 80, [18]),
  film('b', 75, [18]),
  film('c', 70, [35]),
  film('d', 95, [18]),
]
describe('Tonight roles', () => {
  it('selects taste-based, familiar and exploratory candidates without duplicates', () => {
    const picks = selectTonightPicks(pool, [18])
    expect(picks.map((p) => p.film.id)).toEqual(['d', 'a', 'c'])
    expect(picks.map((p) => p.role)).toEqual([
      'Best fit',
      'Familiar territory',
      'A different flavor',
    ])
  })
  it('puts a Watchlist film first when the pool has one', () => {
    const picks = selectTonightPicks(pool, [18], new Set(['c']))
    expect(picks[0]).toMatchObject({
      film: { id: 'c' },
      role: 'From your watchlist',
    })
    expect(picks.map((p) => p.film.id)).toEqual(['c', 'd', 'a'])
  })
  it('avoids claiming personal taste for guests and handles short pools', () => {
    expect(selectTonightPicks(pool.slice(0, 1), [])[0]?.role).toBe(
      'Highly rated'
    )
    expect(selectTonightPicks([], [])).toEqual([])
  })
})
