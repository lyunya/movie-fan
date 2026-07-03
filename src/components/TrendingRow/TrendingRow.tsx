'use client'

import { useState } from 'react'
import type { FC } from 'react'
import { keepPreviousData } from '@tanstack/react-query'
import type { MovieCardProps } from '@/components/MovieCard/types'
import MovieCard from '@/components/MovieCard/MovieCard'
import Carousel from '@/components/Carousel/Carousel'
import { api } from '@/utils/api'

type Window = 'day' | 'week'

/**
 * The "Trending" home row with a Today / This week toggle. The week list is
 * server-rendered (passed in as initialWeek) and shown immediately; we only
 * hit the trending API once the user actually toggles.
 */
const TrendingRow: FC<{ initialWeek: MovieCardProps[] }> = ({ initialWeek }) => {
  const [window, setWindow] = useState<Window>('week')
  const [touched, setTouched] = useState(false)

  const trending = api.tmdb.trending.useQuery(
    { window },
    { enabled: touched, placeholderData: keepPreviousData, staleTime: 60_000 }
  )

  const movies =
    touched && trending.data?.movies ? trending.data.movies : initialWeek
  if (!movies.length) return null

  const options: { key: Window; label: string }[] = [
    { key: 'day', label: 'Today' },
    { key: 'week', label: 'This week' },
  ]

  return (
    <section className="py-4">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 pb-3 sm:px-8">
        <h2 className="section-heading">
          <span className="gradient-text">Trending</span>
        </h2>
        <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-900/70 p-1">
          {options.map((option) => (
            <button
              key={option.key}
              onClick={() => {
                setTouched(true)
                setWindow(option.key)
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                window === option.key
                  ? 'bg-gradient-to-br from-pink-500 to-red-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <Carousel
        movieCards={movies.map((movie) => (
          <MovieCard key={movie.emsVersionId} {...movie} />
        ))}
      />
    </section>
  )
}

export default TrendingRow
