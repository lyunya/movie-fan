'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import type { PersonCredit } from '@/server/tmdb'
import { api } from '@/utils/api'
export default function Filmography({ credits }: { credits: PersonCredit[] }) {
  const { status } = useSession()
  const library = api.user.query.useQuery(undefined, {
    enabled: status === 'authenticated',
  })
  const [role, setRole] = useState('All'),
    [watched, setWatched] = useState('all'),
    [year, setYear] = useState(''),
    [limit, setLimit] = useState(24),
    [sort, setSort] = useState('popular')
  const seen = new Set(
    library.data?.movies.filter((m) => m.watched).map((m) => m.movieId)
  )
  const movies = credits
    .filter(
      (c) =>
        (role === 'All' || role === c.role) &&
        (!year || c.year === year) &&
        (watched === 'all' ||
          (watched === 'yes') === seen.has(String(c.tmdbId)))
    )
    .sort((a, b) =>
      sort === 'year'
        ? (b.year || '').localeCompare(a.year || '')
        : b.popularity - a.popularity
    )
  return (
    <section id="filmography">
      <h2 className="section-heading">Explore this filmography</h2>
      <div className="my-5 flex flex-wrap gap-3">
        <label className="field-label">
          Credits
          <select
            className="field"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {['All', ...new Set(credits.map((c) => c.role))].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Year
          <select
            className="field"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">All years</option>
            {[...new Set(credits.map((c) => c.year).filter(Boolean))]
              .sort()
              .reverse()
              .map((y) => (
                <option key={y} value={y!}>
                  {y}
                </option>
              ))}
          </select>
        </label>
        {status === 'authenticated' && (
          <label className="field-label">
            Your history
            <select
              className="field"
              value={watched}
              onChange={(e) => setWatched(e.target.value)}
            >
              <option value="all">All films</option>
              <option value="yes">Watched</option>
              <option value="no">Unwatched</option>
            </select>
          </label>
        )}
        <label className="field-label">
          Sort
          <select
            className="field"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="popular">Best known</option>
            <option value="year">Newest first</option>
          </select>
        </label>
      </div>
      <p className="mb-4 text-sm text-zinc-400">{movies.length} credits</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {movies.slice(0, limit).map((c) => (
          <Link
            prefetch={false}
            key={`${c.tmdbId}-${c.role}`}
            href={`/movie/${c.tmdbId}`}
            className="group"
          >
            <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-zinc-900">
              <Image
                src={c.posterUrl || '/placeholderposter.svg'}
                alt={`${c.title} poster`}
                fill
                sizes="(max-width: 640px) 45vw, 180px"
                className="object-cover"
              />
            </div>
            <h3 className="mt-2 line-clamp-2 font-semibold group-hover:text-pink-300">
              {c.title}
            </h3>
            <p className="text-sm text-zinc-400">
              {c.year} · {c.role}
              {seen.has(String(c.tmdbId)) ? ' · Watched' : ''}
            </p>
          </Link>
        ))}
      </div>
      {!movies.length && (
        <p className="surface p-6">No credits match these filters.</p>
      )}
      {movies.length > limit && (
        <button
          className="btn-ghost mt-6"
          onClick={() => setLimit((n) => n + 24)}
        >
          Show more credits
        </button>
      )}
    </section>
  )
}
