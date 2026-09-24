'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { HiBookmark, HiOutlineBookmark } from 'react-icons/hi'
import { useWatchlist } from '@/hooks/useWatchlist'
import type { MovieCardProps } from './types'
export default function MovieCard({
  name,
  posterImage,
  emsVersionId,
  releaseDate,
  tomatoMeter,
  imdbRating,
  userRating,
  rank,
}: MovieCardProps) {
  const { has, toggle, pendingId } = useWatchlist()
  const saved = has(emsVersionId)
  const [failedPoster, setFailedPoster] = useState<string | null>(null)
  const poster =
    (typeof posterImage === 'string' ? posterImage : posterImage?.url) ||
    '/placeholderposter.png'
  return (
    <article className="group relative w-[8.5rem] shrink-0 snap-start sm:w-44">
      <div className="relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <Link
          href={`/movie/${emsVersionId}`}
          className="relative block aspect-[2/3]"
          aria-label={`${name}${releaseDate ? ` (${releaseDate.slice(0, 4)})` : ''}`}
        >
          <Image
            src={failedPoster === poster ? '/placeholderposter.png' : poster}
            onError={() => setFailedPoster(poster)}
            fill
            sizes="(max-width:640px) 136px, 176px"
            alt={`${name} poster`}
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        </Link>
        {rank && (
          <span className="absolute left-2 top-2 rounded bg-black/85 px-2 py-1 font-bold">
            #{rank}
          </span>
        )}
        <button
          className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/85 text-white"
          aria-label={`${saved ? 'Remove' : 'Save'} ${name} ${saved ? 'from' : 'to'} watchlist`}
          aria-pressed={saved}
          disabled={pendingId === emsVersionId}
          onClick={() => toggle(emsVersionId)}
        >
          {saved ? (
            <HiBookmark className="h-5 w-5 text-pink-300" />
          ) : (
            <HiOutlineBookmark className="h-5 w-5" />
          )}
        </button>
      </div>
      <Link href={`/movie/${emsVersionId}`} className="mt-2 block">
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-zinc-100 group-hover:text-pink-300">
          {name}
        </h3>
      </Link>
      <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-zinc-400">
        <span>{releaseDate?.slice(0, 4)}</span>
        <span>
          {imdbRating != null
            ? `IMDb ${imdbRating.toFixed(1)}`
            : tomatoMeter != null && tomatoMeter > 0
              ? `TMDB ${tomatoMeter}%`
              : 'Not rated yet'}
        </span>
      </div>
      {userRating != null && (
        <p
          className="mt-1 text-xs text-yellow-300"
          aria-label={`Your rating: ${userRating} out of 5`}
        >
          ★ {userRating} <span className="text-zinc-400">Your rating</span>
        </p>
      )}
    </article>
  )
}
