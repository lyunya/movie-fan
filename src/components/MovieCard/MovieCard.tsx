import type { FC } from 'react'
import type { MovieCardProps } from './types'
import Image from 'next/image'
import Link from 'next/link'

const MovieCard: FC<MovieCardProps> = ({
  name,
  posterImage,
  emsVersionId,
  releaseDate,
  tomatoRating,
  tomatoMeter,
  userRating,
}) => {
  // posterImage is a string for watchlist items and an { url } object (whose
  // url may be missing) for API results
  const posterSrc =
    (typeof posterImage === 'string' ? posterImage : posterImage?.url) ||
    '/placeholderposter.png'

  const year = releaseDate ? String(releaseDate).slice(0, 4) : null
  // tomatoMeter comes from the DB, tomatoRating.tomatometer from the API
  const score = tomatoMeter ?? tomatoRating?.tomatometer ?? null
  const stars = typeof userRating === 'number' ? userRating : null

  return (
    <Link
      href={`/movie/${emsVersionId}`}
      className="group block w-36 shrink-0 snap-start sm:w-44"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg transition duration-300 group-hover:border-zinc-600 group-hover:shadow-pink-900/20">
        <Image
          className="object-cover transition duration-300 group-hover:scale-105"
          src={posterSrc}
          fill
          sizes="(max-width: 640px) 40vw, 180px"
          alt={`${name} poster`}
        />
        {score != null && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
            🍅 {score}%
          </span>
        )}
        {stars != null && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-xs font-semibold text-yellow-400 backdrop-blur">
            ★ {stars}
          </span>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <p className="truncate font-heading text-sm font-semibold text-white transition group-hover:text-pink-400">
          {name}
        </p>
        {year && <p className="text-xs text-zinc-500">{year}</p>}
      </div>
    </Link>
  )
}

export default MovieCard
