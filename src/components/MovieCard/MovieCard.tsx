'use client'

import type { FC, MouseEvent } from 'react'
import type { MovieCardProps } from './types'
import Image from 'next/image'
import Link from 'next/link'
import { HiHeart, HiOutlineHeart } from 'react-icons/hi'
import { useWatchlist } from '@/hooks/useWatchlist'

const MovieCard: FC<MovieCardProps> = ({
  name,
  posterImage,
  emsVersionId,
  releaseDate,
  tomatoMeter,
  userRating,
  rank,
}) => {
  const { has, toggle, pendingId } = useWatchlist()

  // posterImage is a string for watchlist items and an { url } object (whose
  // url may be missing) for API results
  const posterSrc =
    (typeof posterImage === 'string' ? posterImage : posterImage?.url) ||
    '/placeholderposter.png'

  const year = releaseDate ? String(releaseDate).slice(0, 4) : null
  const score = tomatoMeter ?? null
  const stars = typeof userRating === 'number' ? userRating : null

  const onList = has(emsVersionId)
  const isPending = pendingId === emsVersionId

  const handleHeart = (e: MouseEvent) => {
    // The heart lives inside the card link — keep the click from navigating
    e.preventDefault()
    e.stopPropagation()
    toggle(emsVersionId)
  }

  return (
    <Link
      href={`/movie/${emsVersionId}`}
      className={`group relative block shrink-0 snap-start ${
        rank ? 'w-44 sm:w-52' : 'w-36 sm:w-44'
      }`}
    >
      {/* Netflix-style giant rank numeral peeking out from behind the poster.
          Absolutely positioned so it never contributes to the card's height. */}
      {rank && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-11 left-0 z-0 select-none font-heading text-[6rem] font-black leading-none text-zinc-800 transition group-hover:text-zinc-700 sm:bottom-12 sm:text-[7.5rem]"
          style={{ WebkitTextStroke: '2px rgb(236 72 153 / 0.35)' }}
        >
          {rank}
        </span>
      )}

      <div className={rank ? 'relative z-10 ml-8' : undefined}>
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
              ⭐ {score}%
            </span>
          )}
          {stars != null && (
            <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-xs font-semibold text-yellow-400 backdrop-blur">
              ★ {stars}
            </span>
          )}

          {/* Hover reveal: darkened base + details hint */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
          <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white opacity-0 backdrop-blur transition duration-300 group-hover:opacity-100">
            View details →
          </span>

          {/* Quick add / remove. Always visible on touch, hover-revealed on desktop */}
          <button
            onClick={handleHeart}
            aria-label={onList ? 'Remove from watchlist' : 'Add to watchlist'}
            title={onList ? 'Remove from watchlist' : 'Add to watchlist'}
            className={`absolute bottom-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/75 backdrop-blur transition duration-300 hover:scale-110 hover:bg-black/90 focus-visible:opacity-100 ${
              onList
                ? 'text-pink-500'
                : 'text-white sm:opacity-0 sm:group-hover:opacity-100'
            } ${isPending ? 'animate-pulse' : ''}`}
          >
            {onList ? (
              <HiHeart className="h-5 w-5" />
            ) : (
              <HiOutlineHeart className="h-5 w-5" />
            )}
          </button>
        </div>
        <div className="mt-2 px-0.5">
          <p className="truncate font-heading text-sm font-semibold text-white transition group-hover:text-pink-400">
            {name}
          </p>
          {year && <p className="text-xs text-zinc-500">{year}</p>}
        </div>
      </div>
    </Link>
  )
}

export default MovieCard
