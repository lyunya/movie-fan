'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { signIn, useSession } from 'next-auth/react'
import { HiOutlineBookOpen, HiOutlineTrash } from 'react-icons/hi'

import { api } from '@/utils/api'

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 8 }, (_, index) => currentYear - index)

export default function DiaryClient() {
  const { status } = useSession()
  const utils = api.useUtils()
  const [year, setYear] = useState(currentYear)
  const entries = api.diary.list.useQuery(
    { year },
    { enabled: status === 'authenticated' }
  )
  const remove = api.diary.delete.useMutation({
    onSuccess: () => utils.diary.list.invalidate({ year }),
  })

  const rewatches = useMemo(() => {
    const counts = new Map<string, number>()
    for (const entry of entries.data ?? []) {
      counts.set(entry.movieId, (counts.get(entry.movieId) ?? 0) + 1)
    }
    return counts
  }, [entries.data])

  if (status === 'loading') return <div className="min-h-[60vh]" />
  if (status !== 'authenticated') {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <HiOutlineBookOpen className="h-12 w-12 text-pink-400" />
        <h1 className="mt-5 font-heading text-4xl font-bold">
          Your life in movie nights
        </h1>
        <p className="mt-4 text-zinc-400">
          Log watches, rewatches, quick reviews, ratings, and who you watched
          with.
        </p>
        <button className="btn-brand mt-8" onClick={() => signIn()}>
          Sign in to open your diary
        </button>
      </main>
    )
  }

  return (
    <main className="mx-auto w-11/12 max-w-screen-lg pb-16 pt-10">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-pink-400">
            Watching history
          </p>
          <h1 className="mt-2 font-heading text-4xl font-bold sm:text-5xl">
            Your diary
          </h1>
          <p className="mt-2 text-zinc-400">
            {entries.data?.length ?? 0} movie nights in {year}
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-pink-500"
          >
            {YEARS.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <Link href={`/year?year=${year}`} className="btn-brand !px-5 !py-3">
            See {year} recap
          </Link>
        </div>
      </header>

      {entries.isLoading ? (
        <div className="mt-8 flex flex-col gap-4">
          {[0, 1, 2].map((item) => (
            <div key={item} className="surface h-40 animate-pulse" />
          ))}
        </div>
      ) : entries.data?.length ? (
        <div className="mt-8 flex flex-col gap-4">
          {entries.data.map((entry) => (
            <article key={entry.id} className="surface flex gap-4 p-4 sm:gap-6">
              <Link
                href={`/movie/${entry.movieId}`}
                className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-xl sm:w-32"
              >
                <Image
                  src={entry.posterImage || '/placeholderposter.png'}
                  fill
                  sizes="128px"
                  alt={`${entry.name} poster`}
                  className="object-cover"
                />
              </Link>
              <div className="min-w-0 flex-1 py-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-pink-400">
                      {new Date(entry.watchedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {(rewatches.get(entry.movieId) ?? 0) > 1
                        ? ' · Rewatch'
                        : ''}
                    </p>
                    <Link
                      href={`/movie/${entry.movieId}`}
                      className="mt-1 block truncate font-heading text-xl font-bold hover:text-pink-400 sm:text-2xl"
                    >
                      {entry.name}
                    </Link>
                  </div>
                  <button
                    aria-label={`Delete diary entry for ${entry.name}`}
                    className="rounded-full p-2 text-zinc-500 hover:bg-zinc-800 hover:text-red-300"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete this diary entry for “${entry.name}”?`
                        )
                      ) {
                        remove.mutate({ id: entry.id })
                      }
                    }}
                  >
                    <HiOutlineTrash className="h-5 w-5" />
                  </button>
                </div>
                {entry.rating != null && (
                  <p className="mt-2 text-yellow-400">
                    {'★'.repeat(entry.rating)}
                    <span className="text-zinc-700">
                      {'★'.repeat(5 - entry.rating)}
                    </span>
                  </p>
                )}
                {entry.review && (
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-300 sm:text-base">
                    {entry.review}
                  </p>
                )}
                {entry.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.tags.map((tag) => (
                      <span key={tag} className="chip !px-2.5 !py-0.5 !text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="surface mt-8 p-12 text-center">
          <HiOutlineBookOpen className="mx-auto h-10 w-10 text-zinc-600" />
          <h2 className="mt-4 font-heading text-2xl font-bold">
            No entries for {year}
          </h2>
          <p className="mt-2 text-zinc-400">
            Open any movie and choose “Log watch” to start your diary.
          </p>
          <Link href="/" className="btn-brand mt-6">
            Find a movie
          </Link>
        </div>
      )}
    </main>
  )
}
