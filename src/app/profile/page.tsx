'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { WatchListItem } from '@prisma/client'
import { api } from '@/utils/api'
import { useSession } from 'next-auth/react'
import MovieGrid from '@/components/MovieGrid/MovieGrid'
import MovieCard from '@/components/MovieCard/MovieCard'
import MovieCardSkeleton from '@/components/MovieCard/MovieCardSkeleton'
import ProfileCard from '@/components/ProfileCard/ProfileCard'
import ProfileStats from '@/components/ProfileStats/ProfileStats'
import { useAutoAnimate } from '@formkit/auto-animate/react'

type Tab = 'watchlist' | 'seen'
type SortKey = 'title' | 'rating' | 'tomato'

const sorters: Record<SortKey, (a: WatchListItem, b: WatchListItem) => number> = {
  title: (a, b) => a.name.localeCompare(b.name),
  rating: (a, b) => (b.userRating ?? 0) - (a.userRating ?? 0),
  tomato: (a, b) => (b.tomatoMeter ?? 0) - (a.tomatoMeter ?? 0),
}

export default function ProfilePage() {
  const [animationParent] = useAutoAnimate<HTMLDivElement>()
  const [selected, setSelected] = useState<Tab>('watchlist')
  const [sort, setSort] = useState<SortKey>('title')
  const [genreFilter, setGenreFilter] = useState<string | null>(null)
  const { data: sessionData, status } = useSession()

  const profileData = api.user.query.useQuery(undefined, {
    enabled: !!sessionData,
  })

  if (status === 'loading') {
    return (
      <div className="mx-auto w-11/12 max-w-screen-xl pb-16">
        <div className="my-8 h-32 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/70" />
        <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-28 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/70"
            />
          ))}
        </div>
        <MovieGrid
          movieCards={Array.from({ length: 6 }).map((_, idx) => (
            <MovieCardSkeleton key={idx} />
          ))}
        />
      </div>
    )
  }

  if (!sessionData) {
    return (
      <div className="px-4 py-24 text-center">
        <h1 className="mb-4 text-3xl font-bold text-white xl:text-4xl">
          Please sign in to view your profile
        </h1>
        <Link href="/" className="text-pink-400 underline">
          Back to home
        </Link>
      </div>
    )
  }

  const movies = profileData.data?.movies ?? []
  const rated = movies.filter((movie) => movie.userRating)
  const watchList = movies.filter((movie) => !movie.userRating)
  const active = selected === 'seen' ? rated : watchList

  // Genre chips reflect what's actually in the active tab
  const genres = [
    ...new Set(active.flatMap((movie) => movie.genres || [])),
  ].sort()
  const effectiveFilter =
    genreFilter && genres.includes(genreFilter) ? genreFilter : null
  const filtered = effectiveFilter
    ? active.filter((movie) => (movie.genres || []).includes(effectiveFilter))
    : active
  const sorted = [...filtered].sort(sorters[sort])
  const isLoading = profileData.isLoading

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'watchlist', label: 'Watchlist', count: watchList.length },
    { key: 'seen', label: 'Seen', count: rated.length },
  ]

  return (
    <div className="mx-auto w-11/12 max-w-screen-xl pb-16">
      <ProfileCard
        user={profileData.data?.user}
        rated={rated}
        watchList={watchList}
      />

      <ProfileStats movies={movies} />

      <div className="mb-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
        {/* Segmented tabs */}
        <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-900/70 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelected(tab.key)}
              className={`rounded-full px-5 py-2 font-heading text-sm font-semibold transition sm:text-base ${
                selected === tab.key
                  ? 'bg-gradient-to-br from-pink-500 to-red-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}{' '}
              <span
                className={
                  selected === tab.key ? 'text-white/80' : 'text-zinc-500'
                }
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Sort */}
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          Sort by
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-pink-500"
          >
            <option value="title">Title (A–Z)</option>
            {selected === 'seen' && <option value="rating">Your rating</option>}
            <option value="tomato">TMDB score</option>
          </select>
        </label>
      </div>

      {/* Genre filter chips */}
      {genres.length > 1 && (
        <div className="mb-8 flex flex-wrap justify-center gap-2 sm:justify-start">
          <button
            onClick={() => setGenreFilter(null)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              effectiveFilter === null
                ? 'bg-gradient-to-br from-pink-500 to-red-600 text-white'
                : 'border border-zinc-700 bg-zinc-900/70 text-zinc-400 hover:border-zinc-500 hover:text-white'
            }`}
          >
            All
          </button>
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() =>
                setGenreFilter(effectiveFilter === genre ? null : genre)
              }
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                effectiveFilter === genre
                  ? 'bg-gradient-to-br from-pink-500 to-red-600 text-white'
                  : 'border border-zinc-700 bg-zinc-900/70 text-zinc-400 hover:border-zinc-500 hover:text-white'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      <div ref={animationParent}>
        {isLoading ? (
          <MovieGrid
            movieCards={Array.from({ length: 6 }).map((_, idx) => (
              <MovieCardSkeleton key={idx} />
            ))}
          />
        ) : sorted.length > 0 ? (
          <MovieGrid
            movieCards={sorted.map((movie) => (
              <MovieCard key={movie.id} {...movie} />
            ))}
          />
        ) : effectiveFilter ? (
          <div className="py-16 text-center">
            <p className="mb-3 text-xl text-zinc-300">
              No {effectiveFilter} movies here yet.
            </p>
            <button className="btn-ghost" onClick={() => setGenreFilter(null)}>
              Show all genres
            </button>
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="mb-3 text-xl text-zinc-300">
              {selected === 'seen'
                ? "You haven't rated any movies yet."
                : 'Your watchlist is empty.'}
            </p>
            <Link href="/" className="btn-brand">
              Find movies
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
