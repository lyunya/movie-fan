'use client'
import Image from 'next/image'
import Link from 'next/link'
import { HiBookmark, HiOutlineBookmark } from 'react-icons/hi'
import type { HomeFeature } from '@/types/main'
import { useWatchlist } from '@/hooks/useWatchlist'
import TrailerButton from '@/components/ui/TrailerButton'

const runtime = (m: number | null) =>
  m ? `${Math.floor(m / 60) ? `${Math.floor(m / 60)}h ` : ''}${m % 60}m` : null

function Bulbs() {
  return (
    <span className="bulbs" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} />
      ))}
    </span>
  )
}

/**
 * The home page's one cinematic moment: a single film, told well, with the
 * facts that help you decide (runtime, genre, who made it) up front.
 */
export default function FeatureMarquee({ feature }: { feature: HomeFeature }) {
  const { has, toggle, pendingId } = useWatchlist()
  const saved = has(feature.id)
  const meta = [
    feature.year,
    runtime(feature.runtimeMinutes),
    feature.certification,
    feature.genres.join(', '),
    feature.score,
  ].filter(Boolean)
  return (
    <section className="shell-x py-5" aria-labelledby="feature-title">
      <div className="relative isolate flex min-h-[32rem] overflow-hidden rounded-3xl border border-white/10 bg-ink-deep shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)] sm:min-h-[30rem]">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <Image
            src={feature.backdropUrl}
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            alt=""
            className="animate-drift object-cover object-[65%_30%]"
          />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-deep via-ink-deep/80 to-ink-deep/10 md:bg-gradient-to-r md:from-ink-deep md:via-ink-deep/75 md:to-transparent"
        />
        <div className="flex max-w-2xl flex-col justify-end gap-4 p-6 sm:p-10">
          <div className="flex items-center gap-3">
            <Bulbs />
            <p className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.3em] text-gold">
              Tonight’s feature
            </p>
            <span className="hidden sm:block">
              <Bulbs />
            </span>
          </div>
          <h2
            id="feature-title"
            className="font-display text-4xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl"
          >
            {feature.name}
          </h2>
          {meta.length > 0 && (
            <p className="flex flex-wrap gap-x-2 text-sm font-semibold text-zinc-300">
              {meta.map((m, i) => (
                <span key={i} className="flex gap-2">
                  {i > 0 && (
                    <span aria-hidden className="text-zinc-500">
                      ·
                    </span>
                  )}
                  {m}
                </span>
              ))}
            </p>
          )}
          {feature.tagline && (
            <p className="hidden font-display text-lg italic text-pink-100/90 sm:block sm:text-xl">
              “{feature.tagline}”
            </p>
          )}
          {feature.synopsis && (
            <p className="line-clamp-2 max-w-xl leading-relaxed text-zinc-300 sm:line-clamp-3">
              {feature.synopsis}
            </p>
          )}
          {feature.director && (
            <p className="text-sm text-zinc-400">
              Directed by{' '}
              <span className="font-semibold text-zinc-200">
                {feature.director}
              </span>
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Link
              prefetch={false}
              href={`/movie/${feature.id}`}
              className="btn-brand max-sm:!px-4"
            >
              Explore the film
            </Link>
            {feature.trailerUrl && (
              <TrailerButton
                url={feature.trailerUrl}
                title={feature.name}
                className="btn-ghost max-sm:!px-4"
              />
            )}
            <button
              className="btn-quiet"
              aria-pressed={saved}
              disabled={pendingId === feature.id}
              onClick={() => toggle(feature.id)}
            >
              {saved ? (
                <HiBookmark className="h-5 w-5 text-pink-300" aria-hidden />
              ) : (
                <HiOutlineBookmark className="h-5 w-5" aria-hidden />
              )}
              {saved ? 'On your watchlist' : 'Save for later'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
