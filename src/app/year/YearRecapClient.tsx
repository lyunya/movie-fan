'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { HiOutlineShare, HiOutlineSparkles } from 'react-icons/hi'

import { api } from '@/utils/api'

const currentYear = new Date().getFullYear()

export default function YearRecapClient() {
  const { status } = useSession()
  const searchParams = useSearchParams()
  const requestedYear = Number(searchParams.get('year'))
  const [year, setYear] = useState(
    Number.isInteger(requestedYear) && requestedYear >= 1900
      ? requestedYear
      : currentYear
  )
  const entries = api.diary.list.useQuery(
    { year },
    { enabled: status === 'authenticated' }
  )
  const [shared, setShared] = useState(false)

  const stats = useMemo(() => {
    const watches = entries.data ?? []
    const unique = new Set(watches.map((entry) => entry.movieId)).size
    const minutes = watches.reduce(
      (sum, entry) => sum + entry.durationMinutes,
      0
    )
    const rated = watches.filter((entry) => entry.rating != null)
    const average = rated.length
      ? rated.reduce((sum, entry) => sum + (entry.rating ?? 0), 0) /
        rated.length
      : null
    const genres = new Map<string, number>()
    for (const entry of watches) {
      for (const genre of entry.genres)
        genres.set(genre, (genres.get(genre) ?? 0) + 1)
    }
    const topGenre = [...genres.entries()].sort((a, b) => b[1] - a[1])[0]
    const favorite = [...rated].sort(
      (a, b) =>
        (b.rating ?? 0) - (a.rating ?? 0) ||
        b.watchedAt.getTime() - a.watchedAt.getTime()
    )[0]
    const months = Array.from({ length: 12 }, () => 0)
    for (const entry of watches) {
      const month = entry.watchedAt.getMonth()
      months[month] = (months[month] ?? 0) + 1
    }
    return { watches, unique, minutes, average, topGenre, favorite, months }
  }, [entries.data])

  if (status === 'loading') return <div className="min-h-[60vh]" />
  if (status !== 'authenticated') {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <HiOutlineSparkles className="h-12 w-12 text-pink-400" />
        <h1 className="mt-5 font-heading text-4xl font-bold">
          Your year deserves credits
        </h1>
        <p className="mt-4 text-zinc-400">
          Turn your diary into a personal movie recap.
        </p>
        <button className="btn-brand mt-8" onClick={() => signIn()}>
          Sign in to see your recap
        </button>
      </main>
    )
  }

  const maxMonth = Math.max(...stats.months, 1)
  const shareText = `My ${year} in movies: ${stats.watches.length} watches, ${stats.unique} different films, ${Math.round(stats.minutes / 60)} hours${stats.topGenre ? `, and ${stats.topGenre[0]} was my top genre` : ''}.`

  return (
    <main className="mx-auto w-11/12 max-w-screen-lg pb-16 pt-10">
      <header className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-pink-400">
          Movie Fan presents
        </p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            className="text-3xl text-zinc-500 hover:text-white"
            onClick={() => setYear((value) => value - 1)}
            aria-label="Previous year"
          >
            ‹
          </button>
          <h1 className="font-heading text-5xl font-bold sm:text-7xl">
            {year}
          </h1>
          <button
            className="text-3xl text-zinc-500 hover:text-white"
            onClick={() => setYear((value) => Math.min(currentYear, value + 1))}
            aria-label="Next year"
          >
            ›
          </button>
        </div>
        <p className="mt-3 text-zinc-400">Your year in movies</p>
      </header>

      {entries.isLoading ? (
        <div className="surface mt-10 h-96 animate-pulse" />
      ) : stats.watches.length ? (
        <>
          <section className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Movie nights', value: stats.watches.length },
              { label: 'Different films', value: stats.unique },
              { label: 'Hours watched', value: Math.round(stats.minutes / 60) },
              {
                label: 'Average rating',
                value: stats.average ? `${stats.average.toFixed(1)}★` : '—',
              },
            ].map((tile) => (
              <div key={tile.label} className="surface p-5 text-center">
                <p className="font-heading text-3xl font-bold text-white sm:text-4xl">
                  {tile.value}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
                  {tile.label}
                </p>
              </div>
            ))}
          </section>

          <section className="mt-6 grid gap-6 md:grid-cols-2">
            {stats.favorite && (
              <div className="surface flex gap-5 p-5">
                <Link
                  href={`/movie/${stats.favorite.movieId}`}
                  className="relative aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-xl"
                >
                  <Image
                    src={stats.favorite.posterImage || '/placeholderposter.png'}
                    fill
                    sizes="112px"
                    alt=""
                    className="object-cover"
                  />
                </Link>
                <div className="self-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-pink-400">
                    A favorite
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-bold">
                    {stats.favorite.name}
                  </h2>
                  <p className="mt-2 text-yellow-400">
                    {'★'.repeat(stats.favorite.rating ?? 0)}
                  </p>
                </div>
              </div>
            )}
            <div className="surface flex flex-col justify-center p-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Your cinematic comfort zone
              </p>
              <p className="gradient-text mt-3 font-heading text-4xl font-bold">
                {stats.topGenre?.[0] || 'Eclectic'}
              </p>
              {stats.topGenre && (
                <p className="mt-2 text-sm text-zinc-400">
                  Appeared in {stats.topGenre[1]} diary entries
                </p>
              )}
            </div>
          </section>

          <section className="surface mt-6 p-6">
            <h2 className="font-heading text-xl font-bold">
              Your year at a glance
            </h2>
            <div className="mt-6 flex h-44 items-end gap-2 sm:gap-4">
              {stats.months.map((count, month) => (
                <div
                  key={month}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-xs tabular-nums text-zinc-500">
                    {count || ''}
                  </span>
                  <span
                    className="w-full rounded-t-md bg-gradient-to-t from-red-600 to-pink-400"
                    style={{
                      height: `${Math.max((count / maxMonth) * 100, count ? 8 : 2)}%`,
                    }}
                    title={`${new Date(2000, month).toLocaleString(undefined, { month: 'long' })}: ${count}`}
                  />
                  <span className="text-[10px] uppercase text-zinc-600">
                    {new Date(2000, month).toLocaleString(undefined, {
                      month: 'narrow',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-8 flex justify-center">
            <button
              className="btn-brand"
              onClick={async () => {
                try {
                  if (navigator.share) {
                    await navigator.share({
                      title: `My ${year} in movies`,
                      text: shareText,
                    })
                  } else {
                    await navigator.clipboard.writeText(shareText)
                  }
                  setShared(true)
                  setTimeout(() => setShared(false), 2000)
                } catch {
                  // The native share sheet was dismissed.
                }
              }}
            >
              <HiOutlineShare className="h-5 w-5" />{' '}
              {shared ? 'Shared!' : 'Share your year'}
            </button>
          </div>
        </>
      ) : (
        <div className="surface mt-10 p-12 text-center">
          <h2 className="font-heading text-2xl font-bold">
            No diary entries for {year}
          </h2>
          <p className="mt-2 text-zinc-400">
            Log movie nights throughout the year and your recap will build
            itself.
          </p>
          <Link href="/" className="btn-brand mt-6">
            Find a movie
          </Link>
        </div>
      )}
    </main>
  )
}
