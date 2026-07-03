import type { FC, ReactNode } from 'react'
import type { MovieCardProps } from '@/components/MovieCard/types'
import MovieCard from '@/components/MovieCard/MovieCard'
import Carousel from '@/components/Carousel/Carousel'

interface MovieRowProps {
  title: string
  movies: MovieCardProps[]
  /** Optional line under the heading (e.g. "Because you save Horror movies") */
  subtitle?: ReactNode
  /** Netflix-style rank numerals on the first 10 cards */
  ranked?: boolean
}

/**
 * A titled, horizontally-scrolling row of movie cards. Shared by the home
 * page, movie detail "More like this", and the personalized "For you" row so
 * they stay visually identical.
 */
const MovieRow: FC<MovieRowProps> = ({ title, movies, subtitle, ranked = false }) => {
  if (!movies?.length) return null
  return (
    <section className="py-4">
      <div className="mx-auto max-w-screen-2xl px-4 pb-3 sm:px-8">
        <h2 className="section-heading">
          <span className="gradient-text">{title}</span>
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        )}
      </div>
      <Carousel
        movieCards={movies.map((movie, idx) => (
          <MovieCard
            key={movie.emsVersionId}
            {...movie}
            rank={ranked && idx < 10 ? idx + 1 : undefined}
          />
        ))}
      />
    </section>
  )
}

export default MovieRow
