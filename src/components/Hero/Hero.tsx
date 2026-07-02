'use client'

import { useCallback, useEffect, useState } from 'react'
import type { FC } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { HiChevronLeft, HiChevronRight, HiHeart, HiOutlineHeart } from 'react-icons/hi'
import { CgSpinner } from 'react-icons/cg'
import type { MovieCardProps } from '@/components/MovieCard/types'
import { useWatchlist } from '@/hooks/useWatchlist'

const ROTATE_MS = 6000

interface HeroProps {
  movies: MovieCardProps[]
}

const Hero: FC<HeroProps> = ({ movies }) => {
  const slides = movies.slice(0, 5)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const { has, toggle, pendingId } = useWatchlist()
  // Bumped on manual navigation so the auto-advance interval restarts and
  // doesn't fire right after a click
  const [restartKey, setRestartKey] = useState(0)

  const goTo = useCallback(
    (next: number) => {
      setRestartKey((key) => key + 1)
      setIndex((next + slides.length) % slides.length)
    },
    [slides.length]
  )

  useEffect(() => {
    if (slides.length < 2 || paused) return
    // Respect users who prefer reduced motion: no auto-rotation
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % slides.length),
      ROTATE_MS
    )
    return () => clearInterval(timer)
  }, [slides.length, paused, restartKey])

  if (slides.length === 0) return null

  return (
    <section
      className="group/hero relative h-full overflow-hidden rounded-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Popular movies spotlight"
    >
      {slides.map((movie, i) => {
        const poster =
          (typeof movie.posterImage === 'string'
            ? movie.posterImage
            : movie.posterImage?.url) || '/placeholderposter.png'
        const score =
          movie.tomatoMeter ?? movie.tomatoRating?.tomatometer ?? null
        const active = i === index
        const onList = has(movie.emsVersionId)
        const isPending = pendingId === movie.emsVersionId

        return (
          <div
            key={movie.emsVersionId}
            className={`transition-opacity duration-700 ${
              active
                ? 'relative opacity-100'
                : 'pointer-events-none absolute inset-0 opacity-0'
            }`}
            aria-hidden={!active}
          >
            {/* Blurred, darkened poster as an ambient backdrop */}
            <div className="absolute inset-0">
              <Image
                src={poster}
                fill
                priority={i === 0}
                sizes="100vw"
                alt=""
                aria-hidden
                className="scale-110 object-cover blur-2xl brightness-[0.35]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
            </div>

            <div className="relative mx-auto flex max-w-screen-xl flex-col items-center gap-6 px-4 py-10 pb-14 sm:flex-row sm:items-end sm:px-8 sm:py-16 sm:pb-16">
              <div className="relative aspect-[2/3] w-36 shrink-0 overflow-hidden rounded-xl border border-zinc-700 shadow-2xl sm:w-52">
                <Image
                  src={poster}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 640px) 40vw, 210px"
                  alt={`${movie.name} poster`}
                  className="object-cover"
                />
              </div>
              <div className="text-center sm:text-left">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-pink-400">
                  #{i + 1} Popular
                </p>
                <h2 className="font-heading text-3xl font-bold text-white sm:text-5xl">
                  {movie.name}
                </h2>
                {score != null && (
                  <p className="chip mt-4 text-base">🍅 {score}%</p>
                )}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  <Link
                    href={`/movie/${movie.emsVersionId}`}
                    className="btn-brand"
                  >
                    View details
                  </Link>
                  <button
                    className="btn-ghost"
                    onClick={() => toggle(movie.emsVersionId)}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <CgSpinner className="h-5 w-5 animate-spin" />
                    ) : onList ? (
                      <HiHeart className="h-5 w-5 text-pink-500" />
                    ) : (
                      <HiOutlineHeart className="h-5 w-5" />
                    )}
                    {onList ? 'On watchlist' : 'Watchlist'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {slides.length > 1 && (
        <>
          {/* Prev / next — revealed on hover like the carousel rows */}
          <button
            onClick={() => goTo(index - 1)}
            aria-label="Previous movie"
            className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/60 p-2 text-white shadow-lg backdrop-blur transition hover:bg-black/90 sm:group-hover/hero:flex"
          >
            <HiChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => goTo(index + 1)}
            aria-label="Next movie"
            className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/60 p-2 text-white shadow-lg backdrop-blur transition hover:bg-black/90 sm:group-hover/hero:flex"
          >
            <HiChevronRight className="h-6 w-6" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((movie, i) => (
              <button
                key={movie.emsVersionId}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}: ${movie.name}`}
                aria-current={i === index}
                className={`h-2.5 rounded-full transition-all ${
                  i === index
                    ? 'w-6 bg-pink-500'
                    : 'w-2.5 bg-zinc-600 hover:bg-zinc-400'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default Hero
