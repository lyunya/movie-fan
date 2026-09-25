'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signIn, useSession } from 'next-auth/react'
import type { WatchEvent } from '@prisma/client'
import type { FilmDetail } from '@/server/catalog/types'
import { api } from '@/utils/api'
import { POSTER_PLACEHOLDER, filmImage } from '@/utils/film'
import Dialog from '@/components/ui/Dialog'
import MovieFinder from '@/components/ui/MovieFinder'
import WatchEditor from '@/components/DiaryLog/WatchEditor'
import { notify, QueryError } from '@/components/ui/Feedback'
export default function DiaryClient() {
  const { status } = useSession(),
    utils = api.useUtils()
  const [dirty, setDirty] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear()),
    [filter, setFilter] = useState(''),
    [limit, setLimit] = useState(40),
    [finder, setFinder] = useState(false),
    [film, setFilm] = useState<FilmDetail | null>(null),
    [entry, setEntry] = useState<WatchEvent | null>(null),
    [loading, setLoading] = useState(false),
    [calendar, setCalendar] = useState(false)
  const entries = api.diary.list.useQuery(
      { year },
      { enabled: status === 'authenticated' }
    ),
    years = api.diary.years.useQuery(undefined, {
      enabled: status === 'authenticated',
    })
  const remove = api.diary.delete.useMutation({
    onSuccess: () => {
      utils.diary.invalidate()
      notify('Diary entry removed')
    },
    onError: () => notify('Could not remove this entry.', 'error'),
  })
  if (status === 'loading')
    return (
      <main className="page-shell">
        <div className="surface h-72 animate-pulse" />
      </main>
    )
  if (status !== 'authenticated')
    return (
      <main className="page-shell max-w-2xl text-center">
        <p className="eyebrow">The films. The feelings. The company.</p>
        <h1 className="mt-3 text-4xl font-semibold">
          Your life in movie nights.
        </h1>
        <button className="btn-brand mt-6" onClick={() => signIn()}>
          Open your diary
        </button>
      </main>
    )
  const matches = (entries.data || []).filter((e) =>
    `${e.name} ${e.tags.join(' ')}`.toLowerCase().includes(filter.toLowerCase())
  )
  const exportDiary = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(entries.data, null, 2)], {
        type: 'application/json',
      })
    )
    const a = document.createElement('a')
    a.href = url
    a.download = `movie-fan-diary-${year}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <main className="page-shell max-w-5xl">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <Link href="/library" className="eyebrow">
            Your library
          </Link>
          <h1 className="mt-3 text-4xl font-semibold">Your diary</h1>
          <p className="mt-2 text-zinc-400">
            {entries.data?.length || 0} movie nights in {year}
          </p>
        </div>
        <button
          className="btn-brand self-start"
          onClick={() => setFinder(true)}
        >
          + Log a movie
        </button>
      </div>
      <div className="my-6 flex flex-wrap gap-3">
        <select
          aria-label="Diary year"
          className="field !w-auto"
          value={year}
          onChange={(e) => {
            setYear(Number(e.target.value))
            setLimit(40)
          }}
        >
          {(years.data?.years || [year]).map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
        <input
          className="field !w-auto flex-1"
          aria-label="Filter diary by title or tag"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Find a film or tag…"
        />
        <button
          className="btn-ghost !px-4"
          onClick={() => setCalendar(!calendar)}
        >
          {calendar ? 'Timeline' : 'Calendar'}
        </button>
        <Link className="btn-ghost !px-4" href={`/year?year=${year}`}>
          Year in Frames
        </Link>
        <button className="btn-ghost !px-4" onClick={exportDiary}>
          Export diary
        </button>
      </div>
      {entries.isError ? (
        <QueryError retry={() => entries.refetch()} />
      ) : entries.isLoading ? (
        <div className="surface h-64 animate-pulse" />
      ) : calendar ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 12 }, (_, m) => (
            <section key={m} className="surface p-4">
              <h2 className="font-semibold">
                {new Date(year, m).toLocaleDateString(undefined, {
                  month: 'long',
                })}
              </h2>
              {matches
                .filter((e) => e.watchedAt.getUTCMonth() === m)
                .map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setEntry(e)}
                    className="mt-3 block text-left text-sm text-zinc-300"
                  >
                    <span className="mr-2 text-pink-300">
                      {e.watchedAt.getUTCDate()}
                    </span>
                    {e.name}
                  </button>
                ))}
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {matches.slice(0, limit).map((e) => (
            <article key={e.id} className="surface flex gap-4 p-4">
              <Link
                prefetch={false}
                className="shrink-0"
                href={`/movie/${e.movieId}`}
              >
                <Image
                  src={filmImage(e.posterImage, 'w185') || POSTER_PLACEHOLDER}
                  width={80}
                  height={120}
                  className="rounded-lg"
                  alt={`${e.name} poster`}
                />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-pink-300">
                  {e.watchedAt.toLocaleDateString(undefined, {
                    timeZone: 'UTC',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {years.data?.firstWatches[e.movieId] &&
                  e.watchedAt.getTime() >
                    new Date(years.data.firstWatches[e.movieId]!).getTime()
                    ? ' · Rewatch'
                    : ''}{' '}
                  · {e.isPublic ? 'Shared' : 'Private'}
                </p>
                <Link
                  prefetch={false}
                  className="mt-1 block text-xl font-semibold"
                  href={`/movie/${e.movieId}`}
                >
                  {e.name}
                </Link>
                {e.rating && (
                  <p
                    className="mt-1 text-yellow-300"
                    aria-label={`${e.rating} out of 5 stars`}
                  >
                    {'★'.repeat(e.rating)}
                  </p>
                )}
                {e.review && (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-300">
                    {e.review}
                  </p>
                )}
                <p className="mt-2 text-xs text-zinc-400">
                  {e.tags.map((t) => `#${t}`).join(' ')}
                </p>
                <div className="mt-3 flex gap-4 text-sm">
                  <button className="text-pink-300" onClick={() => setEntry(e)}>
                    Edit
                  </button>
                  <button
                    className="text-zinc-400"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (
                        confirm(
                          `Remove this viewing of ${e.name}? Other viewings and your rating will stay.`
                        )
                      )
                        remove.mutate({ id: e.id })
                    }}
                  >
                    Delete entry
                  </button>
                </div>
              </div>
            </article>
          ))}
          {!matches.length && (
            <div className="surface p-10 text-center">
              <h2 className="text-xl">
                Your next movie night starts a new page.
              </h2>
              <button
                className="btn-brand mt-5"
                onClick={() => setFinder(true)}
              >
                Find a film to log
              </button>
            </div>
          )}
          {matches.length > limit && (
            <button
              className="btn-ghost"
              onClick={() => setLimit((n) => n + 40)}
            >
              More entries
            </button>
          )}
        </div>
      )}
      <Dialog
        open={finder}
        onClose={() => setFinder(false)}
        title="What did you watch?"
      >
        <MovieFinder
          busy={loading}
          onChoose={async (m) => {
            setLoading(true)
            try {
              const res = await utils.catalog.details.fetch({ id: m.id })
              if (res.film) {
                setFilm(res.film)
                setFinder(false)
              }
            } catch {
              notify('Could not load that film. Try again.', 'error')
            } finally {
              setLoading(false)
            }
          }}
        />
      </Dialog>
      <Dialog
        open={!!film || !!entry}
        onClose={() => {
          if (
            !dirty ||
            confirm('Close this draft? Unsaved changes will be lost.')
          ) {
            setFilm(null)
            setEntry(null)
          }
        }}
        title={entry ? `Edit ${entry.name}` : `Log ${film?.title || 'a movie'}`}
      >
        {(film || entry) && (
          <WatchEditor
            onDirtyChange={setDirty}
            key={entry?.id || film?.id}
            film={film || undefined}
            entry={entry || undefined}
            onSaved={() => {
              setFilm(null)
              setEntry(null)
            }}
          />
        )}
      </Dialog>
    </main>
  )
}
