import { describe, expect, it } from 'vitest'
import { FEATURE_POOL, featureCandidates } from './feature'

const film = (id: number, art = true) => ({
  id: String(id),
  posterPath: art ? `/p${id}.jpg` : null,
  backdropPath: art ? `/b${id}.jpg` : null,
})
const popular = Array.from({ length: 20 }, (_, i) => film(i + 1))
const day = (n: number, hour = 0) => new Date(Date.UTC(2026, 10, 10 + n, hour))

describe('featureCandidates', () => {
  it('keeps one feature all day and moves to the next film tomorrow', () => {
    const today = featureCandidates(popular, day(0))[0]!
    expect(featureCandidates(popular, day(0, 23))[0]).toBe(today)
    const tomorrow = featureCandidates(popular, day(1))[0]!
    expect(tomorrow).not.toBe(today)
    expect(Number(tomorrow.id)).toBe((Number(today.id) % FEATURE_POOL) + 1)
  })

  it('shows every one of the top ten once before repeating', () => {
    const run = Array.from(
      { length: FEATURE_POOL },
      (_, n) => featureCandidates(popular, day(n))[0]!.id
    )
    expect(new Set(run).size).toBe(FEATURE_POOL)
    expect(run.every((id) => Number(id) <= FEATURE_POOL)).toBe(true)
    expect(featureCandidates(popular, day(FEATURE_POOL))[0]!.id).toBe(run[0])
  })

  it('only considers films with a poster and a backdrop', () => {
    const mixed = [film(1, false), film(2), film(3, false), film(4)]
    for (let n = 0; n < 4; n++)
      expect(['2', '4']).toContain(featureCandidates(mixed, day(n))[0]!.id)
    expect(featureCandidates(mixed, day(0))).toHaveLength(2)
  })

  it('has nothing to offer when no film has artwork', () => {
    expect(featureCandidates([film(1, false)], day(0))).toEqual([])
    expect(featureCandidates([], day(0))).toEqual([])
  })
})
