import { describe, expect, it } from 'vitest'
import { tasteMatch } from './tasteMatch'

const rated = (pairs: [string, number | null][]) =>
  pairs.map(([filmId, rating]) => ({ filmId, rating }))

describe('tasteMatch', () => {
  it('is 100% when both rated the same films the same way', () => {
    const both = rated([
      ['1', 5],
      ['2', 3],
      ['3', 1],
    ])
    expect(tasteMatch(both, both)).toEqual({ percent: 100, shared: 3 })
  })

  it('falls as ratings drift apart, and bottoms out at opposite ends', () => {
    expect(
      tasteMatch(
        rated([
          ['1', 5],
          ['2', 5],
          ['3', 5],
        ]),
        rated([
          ['1', 1],
          ['2', 1],
          ['3', 1],
        ])
      )
    ).toEqual({ percent: 0, shared: 3 })
    expect(
      tasteMatch(
        rated([
          ['1', 5],
          ['2', 4],
          ['3', 2],
          ['4', 3],
        ]),
        rated([
          ['1', 4],
          ['2', 4],
          ['3', 4],
          ['4', 3],
        ])
      )
    ).toEqual({ percent: 81, shared: 4 })
  })

  it('only counts films both have rated', () => {
    expect(
      tasteMatch(
        rated([
          ['1', 5],
          ['2', 5],
          ['3', 5],
          ['4', null],
          ['9', 1],
        ]),
        rated([
          ['1', 5],
          ['2', 5],
          ['3', 5],
          ['4', 1],
          ['8', 1],
        ])
      )
    ).toEqual({ percent: 100, shared: 3 })
  })

  it('says nothing with fewer than three films in common', () => {
    expect(
      tasteMatch(
        rated([
          ['1', 5],
          ['2', 5],
        ]),
        rated([
          ['1', 5],
          ['2', 5],
        ])
      )
    ).toBeNull()
    expect(tasteMatch([], [])).toBeNull()
  })
})
