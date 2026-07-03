'use client'

import { useState } from 'react'
import { CgSpinner } from 'react-icons/cg'
import type { MovieCardProps } from '@/components/MovieCard/types'
import MovieCard from '@/components/MovieCard/MovieCard'
import MovieGrid from '@/components/MovieGrid/MovieGrid'
import { api } from '@/utils/api'

interface GenreResultsProps {
  genreId: number
  initialMovies: MovieCardProps[]
  totalPages: number
}

/**
 * Renders the genre grid: page 1 arrives server-rendered, further pages are
 * fetched on demand through the discoverByGenre tRPC procedure and appended.
 */
export default function GenreResults({
  genreId,
  initialMovies,
  totalPages,
}: GenreResultsProps) {
  const utils = api.useUtils()
  const [movies, setMovies] = useState<MovieCardProps[]>(initialMovies)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const hasMore = page < totalPages

  const loadMore = async () => {
    if (loading) return
    setLoading(true)
    try {
      const next = page + 1
      const res = await utils.tmdb.discoverByGenre.fetch({ genreId, page: next })
      setMovies((prev) => {
        const seen = new Set(prev.map((m) => m.emsVersionId))
        return [...prev, ...res.movies.filter((m) => !seen.has(m.emsVersionId))]
      })
      setPage(next)
    } catch {
      /* transient TMDB hiccup — leave the button so the user can retry */
    } finally {
      setLoading(false)
    }
  }

  if (movies.length === 0) {
    return (
      <p className="py-16 text-center text-xl text-zinc-300">
        No movies found in this genre right now.
      </p>
    )
  }

  return (
    <>
      <MovieGrid
        movieCards={movies.map((movie) => (
          <MovieCard key={movie.emsVersionId} {...movie} />
        ))}
      />
      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="btn-ghost"
            aria-label="Load more movies"
          >
            {loading ? (
              <CgSpinner className="h-5 w-5 animate-spin" />
            ) : (
              'Load more'
            )}
          </button>
        </div>
      )}
    </>
  )
}
