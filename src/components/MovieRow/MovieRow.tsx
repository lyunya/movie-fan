import type { FC, ReactNode } from 'react'
import Link from 'next/link'
import type { Film } from '@/server/catalog/types'
import MovieCard from '@/components/MovieCard/MovieCard'
import Carousel from '@/components/Carousel/Carousel'

interface MovieRowProps {
  title: string
  films: Film[]
  /** Optional line under the heading (e.g. "Because you save Horror movies") */
  subtitle?: ReactNode
  /** Small label above the heading */
  eyebrow?: string
  /** Optional "See all" destination */
  href?: string
  /** Rank badges on the first 10 cards */
  ranked?: boolean
}

/**
 * A titled, horizontally-scrolling row of movie cards. Shared by the home
 * page, movie detail "More like this", and the personalized rows so they
 * stay visually identical.
 */
const MovieRow: FC<MovieRowProps> = ({
  title,
  films,
  subtitle,
  eyebrow,
  href,
  ranked = false,
}) => {
  if (!films?.length) return null
  return (
    <section className="py-5">
      <div className="shell-x flex items-end justify-between gap-4 pb-4">
        <div>
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h2 className="section-heading">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="shrink-0 text-sm font-semibold text-pink-300 hover:text-pink-200"
          >
            See all →
          </Link>
        )}
      </div>
      <Carousel
        movieCards={films.map((film, idx) => (
          <MovieCard
            key={film.id}
            film={film}
            rank={ranked && idx < 10 ? idx + 1 : undefined}
          />
        ))}
      />
    </section>
  )
}

export default MovieRow
