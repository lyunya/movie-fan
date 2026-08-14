'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn, useSession } from 'next-auth/react'
import { HiOutlineSparkles } from 'react-icons/hi'

import MovieCard from '@/components/MovieCard/MovieCard'
import MovieCardSkeleton from '@/components/MovieCard/MovieCardSkeleton'
import { api } from '@/utils/api'

const MOODS = [
  { label: 'Surprise me', genres: [] as number[] },
  { label: 'Funny', genres: [35] },
  { label: 'Intense', genres: [28, 53] },
  { label: 'Scary', genres: [27] },
  { label: 'Romantic', genres: [10749] },
  { label: 'Mind-bending', genres: [878, 9648] },
  { label: 'Family night', genres: [10751, 16] },
]

const RUNTIMES = [
  { label: 'Any length', value: undefined },
  { label: 'Under 90 min', value: 90 },
  { label: 'Under 2 hours', value: 120 },
  { label: 'Epic is fine', value: 180 },
]

export default function TonightClient() {
  const { status } = useSession()
  const [mood, setMood] = useState(0)
  const [runtime, setRuntime] = useState<number | undefined>(120)
  const [minScore, setMinScore] = useState(65)
  const [surprise, setSurprise] = useState(0)
  const [started, setStarted] = useState(false)

  const picks = api.tmdb.tonight.useQuery(
    {
      genreIds: MOODS[mood]?.genres ?? [],
      maxRuntime: runtime,
      minScore,
      surprise,
    },
    { enabled: status === 'authenticated' && started }
  )

  const choose = () => {
    setStarted(true)
    if (started) setSurprise((current) => (current + 1) % 5)
  }

  if (status === 'loading') {
    return <div className="min-h-[60vh]" />
  }

  if (status !== 'authenticated') {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <HiOutlineSparkles className="h-12 w-12 text-pink-400" />
        <h1 className="mt-5 font-heading text-4xl font-bold sm:text-5xl">
          Stop scrolling. Pick a movie.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-zinc-400">
          Tell us your mood and how much time you have. Movie Fan will avoid
          movies you have seen and use your streaming services when available.
        </p>
        <button className="btn-brand mt-8" onClick={() => signIn()}>
          Sign in to get tonight&apos;s picks
        </button>
      </main>
    )
  }

  return (
    <main className="mx-auto w-11/12 max-w-screen-xl pb-16 pt-10 text-white">
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-pink-400">
          Tonight mode
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold sm:text-6xl">
          What are we watching?
        </h1>
        <p className="mt-4 text-zinc-400">
          Three focused picks—no endless carousel.
        </p>
      </header>

      <section className="surface mx-auto mt-8 max-w-4xl p-4 min-[360px]:p-5 sm:p-7">
        <fieldset>
          <legend className="font-heading text-lg font-semibold">Mood</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {MOODS.map((option, index) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={mood === index}
                onClick={() => {
                  setMood(index)
                  setStarted(false)
                }}
                className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mood === index
                    ? 'bg-gradient-to-br from-pink-500 to-red-600 text-white'
                    : 'border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-semibold text-zinc-300">
            How much time?
            <select
              value={runtime ?? ''}
              onChange={(event) => {
                setRuntime(
                  event.target.value ? Number(event.target.value) : undefined
                )
                setStarted(false)
              }}
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-pink-500"
            >
              {RUNTIMES.map((option) => (
                <option key={option.label} value={option.value ?? ''}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-zinc-300">
            Minimum TMDB score: {minScore}%
            <input
              type="range"
              min="40"
              max="85"
              step="5"
              value={minScore}
              onChange={(event) => {
                setMinScore(Number(event.target.value))
                setStarted(false)
              }}
              className="mt-2 accent-pink-500"
            />
          </label>
        </div>

        <div className="mt-7 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-zinc-500">
            Picks exclude movies you have already rated. Final picks use IMDb
            scores when available.
          </p>
          <button
            className="btn-brand w-full sm:w-auto"
            onClick={choose}
            disabled={picks.isFetching}
          >
            <HiOutlineSparkles className="h-5 w-5" />
            {picks.isFetching
              ? 'Finding picks…'
              : started
                ? 'Give me three more'
                : 'Pick for me'}
          </button>
        </div>
      </section>

      {started && (
        <section className="mt-12">
          {picks.isLoading ? (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <MovieCardSkeleton key={index} />
              ))}
            </div>
          ) : picks.data?.movies.length ? (
            <>
              {!picks.data.usingProviders && (
                <p className="mb-6 text-center text-sm text-zinc-400">
                  Want picks limited to services you have?{' '}
                  <Link href="/profile" className="text-pink-400 underline">
                    Choose your streaming services
                  </Link>
                  .
                </p>
              )}
              <div className="grid grid-cols-2 justify-items-center gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-8">
                {picks.data.movies.map((movie, index) => (
                  <div key={movie.emsVersionId} className="w-full max-w-52">
                    <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      {index === 0
                        ? 'Best bet'
                        : index === 1
                          ? 'Strong match'
                          : 'Wildcard'}
                    </p>
                    <MovieCard {...movie} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="surface mx-auto max-w-xl p-8 text-center">
              <p className="text-lg text-zinc-300">
                No picks matched every filter.
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Try a longer runtime, lower score, or fewer provider
                restrictions.
              </p>
            </div>
          )}
        </section>
      )}
    </main>
  )
}
