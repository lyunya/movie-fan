'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { HiOutlineShare, HiCheck } from 'react-icons/hi'
import {
  buildRounds,
  FOCUS_STEPS,
  hashString,
  localDateKey,
  MAX_POINTS,
  MAX_SCORE,
  pointsFor,
  rankFor,
  seededRandom,
  shareText,
  type FrameFilm,
} from '@/utils/frameGame'
import { useLibrary } from '@/hooks/useLibrary'

type Mode = 'daily' | 'practice'

const store = {
  get(key: string) {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* private mode: the game still works, it just won't remember */
    }
  },
}

const tileClass = (p: number | undefined) =>
  p === undefined
    ? 'bg-zinc-800'
    : p >= 3
      ? 'bg-gold'
      : p === 2
        ? 'bg-orange-400'
        : p === 1
          ? 'bg-pink-500'
          : 'bg-zinc-600'

function FilmStrip({
  points,
  total,
  current,
}: {
  points: number[]
  total: number
  current?: number
}) {
  return (
    <ol
      className="flex gap-1 rounded-lg bg-black px-2 py-2.5 [background-image:radial-gradient(circle,#2c2931_1.5px,transparent_2px),radial-gradient(circle,#2c2931_1.5px,transparent_2px)] [background-position:0_2px,0_calc(100%-2px)] [background-repeat:repeat-x] [background-size:10px_5px]"
      aria-label={`Progress: ${points.length} of ${total} frames played`}
    >
      {Array.from({ length: total }, (_, i) => (
        <li
          key={i}
          className={`h-5 flex-1 rounded-sm transition ${tileClass(points[i])} ${i === current ? 'ring-2 ring-white/80' : ''}`}
        >
          <span className="sr-only">
            Frame {i + 1}:{' '}
            {points[i] === undefined ? 'not played' : `${points[i]} points`}
          </span>
        </li>
      ))}
    </ol>
  )
}

export default function FrameGame({ pool }: { pool: FrameFilm[] }) {
  const [mode, setMode] = useState<Mode>('daily')
  const [today, setToday] = useState<string | null>(null)
  const [practiceSeed, setPracticeSeed] = useState(0)
  const [index, setIndex] = useState(0)
  const [step, setStep] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [points, setPoints] = useState<number[]>([])
  const [best, setBest] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const { has, toggleWatchlist: toggle } = useLibrary()
  const scoreCard = useRef<HTMLElement>(null)

  // Dates and randomness are client-only so the static HTML never mismatches.
  useEffect(() => {
    const key = localDateKey()
    setToday(key)
    setPracticeSeed(Math.floor(Math.random() * 2 ** 31))
    const saved = store.get(`frame-game:daily:${key}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setPoints(parsed.map(Number))
      } catch {}
    }
    const bestSaved = Number(store.get('frame-game:best'))
    if (bestSaved) setBest(bestSaved)
  }, [])

  const rounds = useMemo(() => {
    if (!today) return []
    const seed =
      mode === 'daily' ? hashString(`frame:${today}`) : practiceSeed || 1
    return buildRounds(pool, seededRandom(seed))
  }, [pool, today, mode, practiceSeed])

  const answered = picked !== null
  // The last frame still gets its reveal; the score card follows "See your score"
  const finished =
    rounds.length > 0 && points.length >= rounds.length && !answered
  const round = rounds[Math.min(index, rounds.length - 1)]

  // Move focus to the result so keyboard and screen-reader users land on it
  useEffect(() => {
    if (finished) scoreCard.current?.focus({ preventScroll: false })
  }, [finished])
  const score = points.reduce((a, b) => a + b, 0)

  // Warm the next still so the reveal → next transition is instant
  useEffect(() => {
    const next = rounds[index + 1]
    if (next) new window.Image().src = next.answer.backdropUrl
  }, [rounds, index])

  const start = (next: Mode) => {
    setMode(next)
    setIndex(0)
    setStep(0)
    setPicked(null)
    setCopied(false)
    if (next === 'practice') {
      setPracticeSeed(Math.floor(Math.random() * 2 ** 31))
      setPoints([])
    } else {
      const saved = today && store.get(`frame-game:daily:${today}`)
      try {
        setPoints(saved ? JSON.parse(saved) : [])
      } catch {
        setPoints([])
      }
    }
  }

  const choose = useCallback(
    (id: string) => {
      if (!round || answered || points.length >= rounds.length) return
      setPicked(id)
      const earned = pointsFor(step, id === round.answer.id)
      const nextPoints = [...points, earned]
      setPoints(nextPoints)
      if (nextPoints.length === rounds.length) {
        const total = nextPoints.reduce((a, b) => a + b, 0)
        if (mode === 'daily' && today)
          store.set(`frame-game:daily:${today}`, JSON.stringify(nextPoints))
        if (!best || total > best) {
          setBest(total)
          store.set('frame-game:best', String(total))
        }
      }
    },
    [round, answered, step, points, rounds.length, mode, today, best]
  )

  const next = useCallback(() => {
    if (!answered) return
    setPicked(null)
    setStep(0)
    setIndex((i) => i + 1)
  }, [answered])

  const pullFocus = useCallback(() => {
    if (!answered) setStep((s) => Math.min(s + 1, FOCUS_STEPS.length - 1))
  }, [answered])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName))
        return
      const n = Number(e.key)
      if (round && n >= 1 && n <= round.options.length && !answered)
        choose(round.options[n - 1]!.id)
      else if (e.key.toLowerCase() === 'f') pullFocus()
      else if ((e.key === 'Enter' || e.key === 'ArrowRight') && answered) next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [round, answered, choose, pullFocus, next])

  const share = async () => {
    const text = shareText({
      label:
        mode === 'daily' && today
          ? new Date(`${today}T12:00:00`).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          : 'Practice reel',
      points,
      url: `${window.location.origin}/play`,
    })
    try {
      if (navigator.share) await navigator.share({ text })
      else {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } catch {
      /* dismissed */
    }
  }

  const header = (
    <div className="mb-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="eyebrow text-gold">Daily game</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">
          The Frame Game
        </h1>
        <p className="mt-2 max-w-xl text-zinc-400">
          One still, four titles. Guess while it’s blurry for {MAX_POINTS}{' '}
          points, or pull focus for a clearer look.
        </p>
      </div>
      <div className="flex gap-2" role="group" aria-label="Game mode">
        <button
          className="filter-chip"
          aria-pressed={mode === 'daily'}
          onClick={() => start('daily')}
        >
          Today’s reel
        </button>
        <button
          className="filter-chip"
          aria-pressed={mode === 'practice'}
          onClick={() => start('practice')}
        >
          Practice
        </button>
      </div>
    </div>
  )

  if (!today)
    return (
      <main className="page-shell max-w-5xl">
        {header}
        <div className="aspect-video w-full animate-pulse rounded-2xl bg-ink-raised" />
      </main>
    )

  if (!rounds.length)
    return (
      <main className="page-shell max-w-5xl">
        {header}
        <p className="surface p-8 text-zinc-300">
          The projector’s warming up — we couldn’t load today’s stills. Try
          again in a little while.
        </p>
      </main>
    )

  if (finished)
    return (
      <main className="page-shell max-w-5xl">
        {header}
        <section
          ref={scoreCard}
          tabIndex={-1}
          aria-label="Your score"
          className="surface ticket mx-auto max-w-2xl p-8 text-center outline-none sm:p-10"
        >
          <p className="eyebrow text-gold">
            {mode === 'daily' ? 'Today’s reel is in the can' : 'Practice reel'}
          </p>
          <p className="mt-4 font-display text-7xl font-semibold tabular-nums">
            {score}
            <span className="text-3xl text-zinc-500">/{MAX_SCORE}</span>
          </p>
          <p className="mt-2 font-display text-2xl italic text-pink-200">
            {rankFor(score)}
          </p>
          {best != null && (
            <p className="mt-1 text-sm text-zinc-400">Your best: {best}</p>
          )}
          <div className="mx-auto mt-6 max-w-md">
            <FilmStrip points={points} total={rounds.length} />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button className="btn-brand" onClick={share}>
              {copied ? (
                <HiCheck className="h-5 w-5" />
              ) : (
                <HiOutlineShare className="h-5 w-5" />
              )}
              {copied ? 'Copied — no spoilers' : 'Share your reel'}
            </button>
            <button className="btn-ghost" onClick={() => start('practice')}>
              Play a practice reel
            </button>
          </div>
          {mode === 'daily' && (
            <p className="mt-4 text-xs text-zinc-500">
              A new reel rolls at midnight.
            </p>
          )}
        </section>
        <section className="mx-auto mt-10 max-w-2xl">
          <h2 className="section-heading mb-4">End credits</h2>
          <ol className="divide-y divide-ink-line">
            {rounds.map((r, i) => (
              <li key={r.answer.id} className="flex items-center gap-4 py-3">
                <span
                  className={`h-3 w-3 shrink-0 rounded-sm ${tileClass(points[i])}`}
                  aria-hidden
                />
                <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-md">
                  <Image
                    src={r.answer.backdropUrl}
                    fill
                    sizes="96px"
                    alt=""
                    className="object-cover"
                  />
                </div>
                <Link
                  prefetch={false}
                  href={`/movie/${r.answer.id}`}
                  className="flex-1 font-semibold hover:text-pink-300"
                >
                  {r.answer.name}{' '}
                  <span className="font-normal text-zinc-500">
                    {r.answer.year}
                  </span>
                </Link>
                <span className="text-sm tabular-nums text-zinc-400">
                  {points[i] ?? 0} pt{points[i] === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    )

  if (!round) return null
  const correct = picked === round.answer.id
  const worth = MAX_POINTS - step
  return (
    <main className="page-shell max-w-5xl">
      {header}
      <FilmStrip points={points} total={rounds.length} current={index} />
      <div className="relative mt-4 aspect-video max-h-[58vh] w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]">
        <Image
          key={round.answer.id}
          src={round.answer.backdropUrl}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1024px"
          alt={
            answered
              ? `A still from ${round.answer.name}`
              : 'A mystery film still, out of focus'
          }
          className="object-cover transition-[filter,transform] duration-700 ease-out"
          style={{
            filter: `blur(${answered ? 0 : FOCUS_STEPS[step]}px) saturate(${answered ? 1 : 0.85})`,
            transform: answered ? 'scale(1)' : 'scale(1.08)',
          }}
        />
        <div className="absolute left-3 top-3 flex gap-2 text-xs font-bold">
          <span className="rounded-full bg-black/70 px-3 py-1.5 backdrop-blur">
            Frame {index + 1} / {rounds.length}
          </span>
          {!answered && (
            <span className="rounded-full bg-gold px-3 py-1.5 text-black">
              Worth {worth} pt{worth === 1 ? '' : 's'}
            </span>
          )}
        </div>
        {answered && (
          <div className="absolute inset-x-0 bottom-0 animate-rise-in bg-gradient-to-t from-black/90 to-transparent p-5 pt-16">
            <p
              className={`text-sm font-bold ${correct ? 'text-gold' : 'text-pink-300'}`}
            >
              {correct
                ? `Nice eye! +${points[points.length - 1]}`
                : 'Not quite — it was'}
            </p>
            <p className="font-display text-2xl font-semibold sm:text-3xl">
              {round.answer.name}{' '}
              <span className="text-lg font-normal text-zinc-400">
                {round.answer.year}
              </span>
            </p>
          </div>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {answered
          ? correct
            ? `Correct, ${round.answer.name}.`
            : `Incorrect. The film was ${round.answer.name}.`
          : ''}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {round.options.map((o, i) => {
          const isAnswer = o.id === round.answer.id
          const state = !answered
            ? 'border-zinc-700 hover:border-pink-400 hover:bg-pink-500/10'
            : isAnswer
              ? 'border-gold bg-gold/10 text-gold'
              : o.id === picked
                ? 'border-pink-500 bg-pink-500/10 text-pink-200 line-through'
                : 'border-zinc-800 text-zinc-500'
          return (
            <button
              key={o.id}
              disabled={answered}
              onClick={() => choose(o.id)}
              className={`flex min-h-14 items-center gap-3 rounded-xl border bg-ink-raised px-4 py-3 text-left font-semibold transition disabled:cursor-default disabled:opacity-100 ${state}`}
            >
              <kbd className="hidden h-6 w-6 shrink-0 place-items-center rounded bg-zinc-800 text-xs text-zinc-400 sm:grid">
                {i + 1}
              </kbd>
              {o.name}
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {!answered ? (
          <button
            className="btn-quiet"
            onClick={pullFocus}
            disabled={step >= FOCUS_STEPS.length - 1}
          >
            🔍 Pull focus{' '}
            <span className="text-zinc-500">
              (−1 pt{step < FOCUS_STEPS.length - 1 ? '' : ', sharpest'})
            </span>
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Link
              prefetch={false}
              className="btn-quiet"
              href={`/movie/${round.answer.id}`}
              target="_blank"
            >
              About this film ↗
            </Link>
            <button
              className="btn-quiet"
              aria-pressed={has(round.answer.id)}
              onClick={() => toggle(round.answer.id)}
            >
              {has(round.answer.id) ? '✓ On your watchlist' : '+ Watchlist'}
            </button>
          </div>
        )}
        {answered && (
          <button className="btn-brand" onClick={next} autoFocus>
            {index + 1 === rounds.length ? 'See your score' : 'Next frame →'}
          </button>
        )}
      </div>
      <p className="mt-6 hidden text-xs text-zinc-500 sm:block">
        Keyboard: 1–4 to guess · F to pull focus · Enter for the next frame
      </p>
    </main>
  )
}
