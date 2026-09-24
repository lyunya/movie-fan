/**
 * The Frame Game: guess a film from one out-of-focus still. Pure logic lives
 * here (seeded rounds, scoring, share text) so it's deterministic and tested;
 * the component only renders it.
 */
export interface FrameFilm {
  id: string
  name: string
  year: string | null
  backdropUrl: string
  genreIds: number[]
}

export interface FrameRound {
  answer: FrameFilm
  options: FrameFilm[]
}

export const ROUNDS = 10
export const OPTIONS = 4
/** Blur (px) at each focus step; guessing sooner is worth more. */
export const FOCUS_STEPS = [26, 13, 5] as const
export const MAX_POINTS = FOCUS_STEPS.length
export const MAX_SCORE = ROUNDS * MAX_POINTS

/** Small, fast, seedable PRNG (mulberry32). */
export function seededRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(value: string) {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function shuffle<T>(items: T[], rng: () => number) {
  const copy = items.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

/**
 * Builds up to `count` rounds with no repeated answers. Distractors prefer
 * films that share a genre with the answer so the choices aren't a giveaway.
 * The pool is sorted by id first, so the same seed + pool always produces
 * the same reel regardless of the order the lists arrived in.
 */
export function buildRounds(
  pool: FrameFilm[],
  rng: () => number,
  count = ROUNDS
): FrameRound[] {
  const unique = [...new Map(pool.map((f) => [f.id, f])).values()].sort(
    (a, b) => a.id.localeCompare(b.id)
  )
  if (unique.length < OPTIONS) return []
  const answers = shuffle(unique, rng).slice(0, count)
  return answers.map((answer) => {
    const others = shuffle(
      unique.filter((f) => f.id !== answer.id),
      rng
    )
    const related = others.filter((f) =>
      f.genreIds.some((g) => answer.genreIds.includes(g))
    )
    const distractors = [
      ...related,
      ...others.filter((f) => !related.includes(f)),
    ].slice(0, OPTIONS - 1)
    return { answer, options: shuffle([answer, ...distractors], rng) }
  })
}

/** Points for a guess made at focus step `step` (0 = blurriest). */
export const pointsFor = (step: number, correct: boolean) =>
  correct ? Math.max(0, MAX_POINTS - step) : 0

export function rankFor(score: number) {
  const ratio = score / MAX_SCORE
  if (ratio >= 1) return 'Projectionist Supreme'
  if (ratio >= 0.8) return 'Cinephile'
  if (ratio >= 0.55) return 'Film Buff'
  if (ratio >= 0.3) return 'Matinee Regular'
  return 'Popcorn Enthusiast'
}

const TILE = ['⬛', '🟪', '🟧', '🟨'] as const

export function shareText({
  label,
  points,
  url,
}: {
  label: string
  points: number[]
  url: string
}) {
  const score = points.reduce((a, b) => a + b, 0)
  const tiles = points.map((p) => TILE[p] ?? TILE[0]).join('')
  return `🎞️ The Frame Game · ${label}\n${tiles}  ${score}/${MAX_SCORE}\n${rankFor(score)}\n${url}`
}

/** Local calendar date, so "today's reel" changes at the player's midnight. */
export const localDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
