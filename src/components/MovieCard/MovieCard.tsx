'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { HiBookmark, HiOutlineBookmark } from 'react-icons/hi'
import { useWatchlist } from '@/hooks/useWatchlist'
import type { Film } from '@/server/catalog/types'
import {
  POSTER_PLACEHOLDER as PLACEHOLDER,
  filmImage,
  filmScore,
  filmYear,
} from '@/utils/film'

export default function MovieCard({
  film,
  userRating,
  rank,
}: {
  film: Film
  /** The signed-in Member's own star rating, when it's in their Library */
  userRating?: number | null
  /** Renders a rank numeral on the poster */
  rank?: number
}) {
  const { id, title: name } = film
  const { has, toggle, pendingId } = useWatchlist()
  const saved = has(id)
  const [failedPoster, setFailedPoster] = useState<string | null>(null)
  // Cards render at <=176 CSS px, so w342 is sharp at 2x
  const poster = filmImage(film.posterPath, 'w342') || PLACEHOLDER
  const year = filmYear(film)
  const score = filmScore(film)
  return (
    <article className="group relative w-[8.5rem] shrink-0 snap-start sm:w-44">
      <div className="relative overflow-hidden rounded-lg bg-ink-raised shadow-[0_18px_36px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/[0.06] transition duration-300 group-hover:-translate-y-1 group-hover:ring-pink-400/60 motion-reduce:transform-none">
        <Link
          prefetch={false}
          href={`/movie/${id}`}
          className="relative block aspect-[2/3]"
          aria-label={`${name}${year ? ` (${year})` : ''}`}
        >
          <Image
            src={failedPoster === poster ? PLACEHOLDER : poster}
            onError={() => setFailedPoster(poster)}
            fill
            sizes="(max-width:640px) 136px, 176px"
            alt={`${name} poster`}
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent"
          />
        </Link>
        {rank && (
          <span
            className="pointer-events-none absolute bottom-1 left-2 font-display text-5xl font-black italic leading-none text-white [text-shadow:0_2px_12px_rgba(0,0,0,.8)]"
            aria-label={`Rank ${rank}`}
          >
            {rank}
          </span>
        )}
        <button
          className="absolute bottom-1.5 right-1.5 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/15 backdrop-blur-sm transition hover:bg-black/80"
          aria-label={`${saved ? 'Remove' : 'Save'} ${name} ${saved ? 'from' : 'to'} watchlist`}
          aria-pressed={saved}
          disabled={pendingId === id}
          onClick={() => toggle(id)}
        >
          {saved ? (
            <HiBookmark className="h-5 w-5 text-pink-300" />
          ) : (
            <HiOutlineBookmark className="h-5 w-5" />
          )}
        </button>
      </div>
      <Link prefetch={false} href={`/movie/${id}`} className="mt-2.5 block">
        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-zinc-100 transition group-hover:text-pink-200">
          {name}
        </h3>
      </Link>
      <p className="mt-1 flex flex-wrap gap-x-2 text-xs text-zinc-400">
        {year && <span>{year}</span>}
        {year && <span aria-hidden>·</span>}
        {/* Release-date checks depend on "now"; an ISR page may be hours old */}
        <span
          suppressHydrationWarning
          className={score.kind === 'none' ? 'italic' : undefined}
        >
          {score.label}
        </span>
      </p>
      {!!userRating && userRating > 0 && userRating <= 5 && (
        <p
          className="mt-1 text-xs text-gold"
          aria-label={`Your rating: ${userRating} out of 5`}
        >
          {'★'.repeat(userRating)}
          <span className="text-zinc-600">{'★'.repeat(5 - userRating)}</span>
        </p>
      )}
    </article>
  )
}
