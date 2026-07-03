'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Balancer from 'react-wrap-balancer'
import { useSession, signIn } from 'next-auth/react'
import { HiOutlineShare, HiCheck, HiPlay } from 'react-icons/hi'

import { api } from '@/utils/api'
import { createMovieObj } from '@/utils/createMovieObj'
import type { IMovieDetail } from './types'
import StarRating from '@/components/StarRating/StarRating'
import CastGrid from '../CastGrid/CastGrid'
import Lightbox from '@/components/Lightbox/Lightbox'
import MovieRow from '@/components/MovieRow/MovieRow'
import { toSlug } from '@/utils/slug'

const formatRuntime = (minutes?: number | null) => {
  if (!minutes) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const formatFullDate = (dateString?: string | null) => {
  if (!dateString) return null
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const ScoreBadge = ({
  score,
  count,
  suffix = '%',
}: {
  score?: number | null
  count?: number | null
  suffix?: string
}) => {
  if (score == null) return null
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl" aria-hidden>
        ⭐
      </span>
      <div className="leading-tight">
        <p className="text-lg font-bold text-white">
          {score}
          {suffix}
        </p>
        {count ? (
          <p className="text-xs text-zinc-400">
            {count.toLocaleString()} TMDB ratings
          </p>
        ) : null}
      </div>
    </div>
  )
}

const ProviderRow = ({
  label,
  providers,
}: {
  label: string
  providers: { name: string; logoUrl: string }[]
}) => {
  if (providers.length === 0) return null
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
        {providers.map((provider) => (
          <div
            key={provider.name}
            title={provider.name}
            className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-zinc-800"
          >
            <Image
              src={provider.logoUrl}
              fill
              sizes="40px"
              alt={provider.name}
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

const MovieDetails = ({ id, movie }: { id: string; movie: IMovieDetail }) => {
  const { data: session } = useSession()
  const utils = api.useUtils()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [showTrailer, setShowTrailer] = useState(false)

  // Navigating movie→movie (e.g. via "More like this") stays on the same
  // /movie/[id] route segment, which the App Router reuses without resetting
  // scroll — so jump to the top whenever the movie changes.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  const invalidateWatchlist = () => {
    utils.movie.query.invalidate({ movieId: id })
    utils.user.query.invalidate()
  }

  const addMovie = api.movie.create.useMutation({ onSuccess: invalidateWatchlist })
  const removeMovie = api.movie.delete.useMutation({ onSuccess: invalidateWatchlist })
  // The query is a protected procedure, so only run it when signed in
  const watchlistItem = api.movie.query.useQuery(
    { movieId: id },
    { enabled: !!session }
  )

  const genres: string[] = (movie.genres || []).map((genre) => genre.name)
  const poster = movie.posterImage?.url || '/placeholderposter.png'
  const backdrop = movie.backgroundImage?.url || poster
  const year = movie.releaseDate ? String(movie.releaseDate).slice(0, 4) : null
  const fullReleaseDate = formatFullDate(movie.releaseDate)
  const runtime = formatRuntime(movie.durationMinutes)
  const gallery = (movie.images || []).filter((img) => img?.url)
  const providers = movie.watchProviders
  const hasProviders = !!providers && [
    ...providers.flatrate,
    ...providers.rent,
    ...providers.buy,
  ].length > 0

  const facts: { label: string; value: string | null }[] = [
    { label: 'Release date', value: fullReleaseDate },
    { label: 'Runtime', value: runtime },
    { label: 'Director', value: movie.directedBy || null },
    { label: 'Box office', value: movie.totalGross || null },
    { label: 'Rated', value: movie.motionPictureRating?.code || null },
  ].filter((fact) => fact.value)

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: movie.name, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* user dismissed the share sheet — nothing to do */
    }
  }

  const handleAddMovie = () => {
    addMovie.mutate({ movieData: createMovieObj(movie, id, genres) })
  }
  const handleRemoveMovie = () => removeMovie.mutate({ movieId: id })
  // The server upserts on [userId, movieId], so rating a movie is a single
  // mutation whether or not it is already on the watchlist
  const handleSeenMovie = (userRating: number) => {
    addMovie.mutate({
      movieData: createMovieObj(movie, id, genres, userRating),
    })
  }

  const onWatchlist = !!watchlistItem.data?.movie.length
  const currentUserRating = watchlistItem.data?.movie[0]?.userRating || 0

  return (
    <article className="pb-24 text-white">
      {/* Backdrop hero */}
      <div className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={backdrop}
            fill
            priority
            sizes="100vw"
            alt=""
            aria-hidden
            className="object-cover object-top blur-sm brightness-[0.3]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
        </div>

        <div className="relative mx-auto flex max-w-screen-xl flex-col gap-8 px-4 py-8 sm:flex-row sm:px-8 sm:py-12">
          {/* Poster */}
          <div className="relative mx-auto aspect-[2/3] w-44 shrink-0 overflow-hidden rounded-xl border border-zinc-700 shadow-2xl sm:mx-0 sm:w-60">
            <Image
              src={poster}
              fill
              priority
              sizes="(max-width: 640px) 45vw, 240px"
              alt={`${movie.name} poster`}
              className="object-cover"
            />
          </div>

          {/* Meta */}
          <div className="flex-1">
            <h1 className="font-heading text-3xl font-bold sm:text-5xl">
              <Balancer>{movie.name}</Balancer>
            </h1>

            {/* Fact chips */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {year && <span className="chip">{year}</span>}
              {runtime && <span className="chip">{runtime}</span>}
              {movie.motionPictureRating?.code && (
                <span className="chip">{movie.motionPictureRating.code}</span>
              )}
            </div>

            {/* Genres — each links to a browsable genre page when we have its id */}
            {movie.genres.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {movie.genres.map((genre) =>
                  genre.id ? (
                    <Link
                      key={genre.name}
                      href={`/genre/${toSlug(genre.id, genre.name)}`}
                      className="rounded-full bg-zinc-800/80 px-3 py-1 text-sm text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
                    >
                      {genre.name}
                    </Link>
                  ) : (
                    <span
                      key={genre.name}
                      className="rounded-full bg-zinc-800/80 px-3 py-1 text-sm text-zinc-300"
                    >
                      {genre.name}
                    </span>
                  )
                )}
              </div>
            )}

            {/* Score */}
            <div className="mt-5 flex flex-wrap items-center gap-6">
              <ScoreBadge score={movie.tomatoMeter} count={movie.voteCount} />
            </div>

            {movie.directedBy && (
              <p className="mt-5 text-zinc-300">
                <span className="text-zinc-500">Directed by</span>{' '}
                {movie.directedBy}
              </p>
            )}

            {movie.synopsis && (
              <p className="mt-3 max-w-2xl leading-relaxed text-zinc-200">
                {movie.synopsis}
              </p>
            )}

            {/* Watchlist / rating / share actions */}
            <div className="mt-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {!session ? (
                  <button className="btn-brand" onClick={() => signIn()}>
                    Sign in to add to watchlist &amp; rate
                  </button>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-zinc-400">
                        Your rating:
                      </span>
                      <StarRating
                        value={currentUserRating}
                        onChange={handleSeenMovie}
                      />
                    </div>
                    {onWatchlist ? (
                      <button className="btn-ghost" onClick={handleRemoveMovie}>
                        Remove from watchlist
                      </button>
                    ) : (
                      <button className="btn-brand" onClick={handleAddMovie}>
                        + Add to watchlist
                      </button>
                    )}
                  </>
                )}
                <button
                  className="btn-ghost"
                  onClick={handleShare}
                  aria-label="Share this movie"
                >
                  {copied ? (
                    <>
                      <HiCheck className="h-5 w-5 text-green-400" />
                      Link copied!
                    </>
                  ) : (
                    <>
                      <HiOutlineShare className="h-5 w-5" />
                      Share
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-xl px-4 sm:px-8">
        {/* Tagline */}
        {movie.consensus && (
          <blockquote className="surface my-8 border-l-4 border-pink-500 p-5 text-lg italic text-zinc-200 md:text-xl">
            <Balancer>{movie.consensus}</Balancer>
          </blockquote>
        )}

        {/* Trailer — click-to-play facade so YouTube only loads on demand */}
        {movie.trailer?.url && (
          <section className="my-10">
            <h3 className="section-heading mb-4">Trailer</h3>
            {showTrailer ? (
              <iframe
                src={`${movie.trailer.url}?autoplay=1`}
                title={`${movie.name} trailer`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="aspect-video w-full rounded-xl border border-zinc-800 bg-black"
              />
            ) : (
              <button
                onClick={() => setShowTrailer(true)}
                aria-label={`Play ${movie.name} trailer`}
                className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-black"
              >
                <Image
                  src={backdrop}
                  fill
                  sizes="100vw"
                  alt=""
                  aria-hidden
                  className="object-cover opacity-50 transition duration-300 group-hover:opacity-70"
                />
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-pink-600/90 text-white shadow-lg transition duration-300 group-hover:scale-110 group-hover:bg-pink-500">
                  <HiPlay className="h-8 w-8 translate-x-0.5" />
                </span>
              </button>
            )}
          </section>
        )}

        {/* Photo gallery — click any still to open the lightbox */}
        {gallery.length > 0 && (
          <section className="my-10">
            <h3 className="section-heading mb-4">
              Photos{' '}
              <span className="text-base font-normal text-zinc-500">
                ({gallery.length})
              </span>
            </h3>
            <div className="hide-scrollbar edge-fade-x flex gap-4 overflow-x-auto pb-2">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  aria-label={`View photo ${idx + 1} of ${gallery.length}`}
                  className="group relative aspect-video h-40 shrink-0 overflow-hidden rounded-lg border border-zinc-800 transition hover:border-zinc-500 sm:h-52"
                >
                  <Image
                    src={img.url}
                    fill
                    sizes="360px"
                    alt={`${movie.name} still ${idx + 1}`}
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {lightboxIndex != null && (
          <Lightbox
            images={gallery}
            startIndex={lightboxIndex}
            altBase={movie.name}
            onClose={() => setLightboxIndex(null)}
          />
        )}

        {/* Cast & crew */}
        {movie.cast?.length > 0 && <CastGrid cast={movie.cast} title="Cast" />}
        {movie.crew?.length > 0 && <CastGrid cast={movie.crew} title="Crew" />}

        {/* Movie facts */}
        {facts.length > 0 && (
          <section className="my-10">
            <h3 className="section-heading mb-4">Details</h3>
            <dl className="surface grid grid-cols-1 gap-x-8 gap-y-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {fact.label}
                  </dt>
                  <dd className="mt-1 text-zinc-100">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Where to watch */}
        {hasProviders && providers && (
          <section className="my-10">
            <h3 className="section-heading mb-4">Where to watch</h3>
            <div className="surface flex flex-col gap-5 p-5">
              <ProviderRow label="Stream" providers={providers.flatrate} />
              <ProviderRow label="Rent" providers={providers.rent} />
              <ProviderRow label="Buy" providers={providers.buy} />
              <div className="flex flex-col gap-2 border-t border-zinc-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-zinc-500">
                  Streaming data provided by JustWatch
                </p>
                {providers.link && (
                  <a
                    href={providers.link}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost"
                  >
                    More info
                  </a>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* More like this — full-bleed carousel outside the padded container */}
      {movie.similar?.length > 0 && (
        <div className="mt-2">
          <MovieRow title="More like this" movies={movie.similar} />
        </div>
      )}

      {/* Sticky mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-black/90 p-3 backdrop-blur sm:hidden">
        {!session ? (
          <button className="btn-brand w-full" onClick={() => signIn()}>
            Sign in to add &amp; rate
          </button>
        ) : onWatchlist ? (
          // On the watchlist: rate inline (left) and remove (right)
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Rate</span>
              <StarRating
                value={currentUserRating}
                onChange={handleSeenMovie}
                size={26}
              />
            </div>
            <button
              className="btn-ghost !px-4 !py-2 !text-sm"
              onClick={handleRemoveMovie}
            >
              Remove
            </button>
          </div>
        ) : (
          <button className="btn-brand w-full" onClick={handleAddMovie}>
            + Add to watchlist
          </button>
        )}
      </div>
    </article>
  )
}

export default MovieDetails
