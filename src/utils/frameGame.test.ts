import { describe, expect, it } from 'vitest'
import {
  buildRounds,
  hashString,
  MAX_SCORE,
  OPTIONS,
  pointsFor,
  rankFor,
  seededRandom,
  shareText,
  localDateKey,
  type FrameFilm,
} from './frameGame'

const film = (i: number, genreIds = [i % 3]): FrameFilm => ({
  id: String(100 + i),
  name: `Film ${i}`,
  year: String(1990 + i),
  backdropUrl: `https://image.tmdb.org/t/p/w780/${i}.jpg`,
  genreIds,
})
const pool = Array.from({ length: 30 }, (_, i) => film(i))

describe('buildRounds', () => {
  it('is deterministic for a seed, regardless of pool order', () => {
    const a = buildRounds(pool, seededRandom(hashString('2026-09-24')))
    const b = buildRounds(
      pool.slice().reverse(),
      seededRandom(hashString('2026-09-24'))
    )
    expect(a.map((r) => r.answer.id)).toEqual(b.map((r) => r.answer.id))
    expect(a[0]!.options.map((o) => o.id)).toEqual(
      b[0]!.options.map((o) => o.id)
    )
  })

  it('never repeats an answer and always includes it among unique options', () => {
    const rounds = buildRounds(pool, seededRandom(7))
    expect(rounds).toHaveLength(10)
    expect(new Set(rounds.map((r) => r.answer.id)).size).toBe(10)
    for (const round of rounds) {
      expect(round.options).toHaveLength(OPTIONS)
      expect(new Set(round.options.map((o) => o.id)).size).toBe(OPTIONS)
      expect(round.options).toContain(round.answer)
    }
  })

  it('prefers distractors that share a genre', () => {
    const rounds = buildRounds(pool, seededRandom(3))
    for (const { answer, options } of rounds) {
      const others = options.filter((o) => o.id !== answer.id)
      expect(
        others.every((o) => o.genreIds.some((g) => answer.genreIds.includes(g)))
      ).toBe(true)
    }
  })

  it('dedupes the pool and bails out when it is too small', () => {
    expect(buildRounds([film(1), film(1), film(2)], seededRandom(1))).toEqual(
      []
    )
    expect(buildRounds(pool.slice(0, 5), seededRandom(1))).toHaveLength(5)
  })
})

describe('scoring', () => {
  it('rewards early guesses and zeroes misses', () => {
    expect(pointsFor(0, true)).toBe(3)
    expect(pointsFor(2, true)).toBe(1)
    expect(pointsFor(0, false)).toBe(0)
    expect(rankFor(MAX_SCORE)).toBe('Projectionist Supreme')
    expect(rankFor(0)).toBe('Popcorn Enthusiast')
  })

  it('builds a spoiler-free share card', () => {
    const text = shareText({
      label: 'Sep 24',
      points: [3, 2, 1, 0, 3, 3, 3, 3, 3, 3],
      url: 'https://example.com/play',
    })
    expect(text).toContain('🟨🟧🟪⬛')
    expect(text).toContain(`24/${MAX_SCORE}`)
    expect(text).not.toContain('Film')
  })

  it('keys the daily reel to the local calendar date', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})
