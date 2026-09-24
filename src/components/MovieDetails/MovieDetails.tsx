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
import FollowNews from '@/components/ui/FollowNews'
import MovieRow from '@/components/MovieRow/MovieRow'
import { toSlug } from '@/utils/slug'
import DiaryLogButton from '@/components/DiaryLog/DiaryLogButton'
import Availability from './Availability'
import { notify } from '@/components/ui/Feedback'
import ListPicker from '@/components/ListPicker/ListPicker'

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
  tmdbScore,
  tmdbCount,
  imdbRating,
  imdbCount,
}: {
  tmdbScore?: number | null
  tmdbCount?: number | null
  imdbRating?: number | null
  imdbCount?: number | null
}) => {
  const usingImdb = imdbRating != null
  const score = usingImdb ? imdbRating : tmdbScore
  const count = usingImdb ? imdbCount : tmdbCount
  if (score == null) return null
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl" aria-hidden>
        ⭐
      </span>
      <div className="leading-tight">
        <p className="text-lg font-bold text-white">
          {usingImdb ? `${score.toFixed(1)}/10` : `${score}%`}
        </p>
        {count ? (
          <p className="text-xs text-zinc-400">
            {count.toLocaleString()} {usingImdb ? 'IMDb' : 'TMDB'} ratings
          </p>
        ) : (
          <p className="text-xs text-zinc-400">
            {usingImdb ? 'IMDb' : 'TMDB'} score
          </p>
        )}
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

  const addMovie = api.movie.create.useMutation({
    onSuccess: () => {
      invalidateWatchlist()
      notify('Collection updated')
    },
    onError: () =>
      notify('Could not save your change. Please try again.', 'error'),
  })
  const removeMovie = api.movie.delete.useMutation({
    onSuccess: () => {
      invalidateWatchlist()
      notify(
        'Removed from watchlist. Your rating and history are kept.',
        'success',
        () =>
          addMovie.mutate({
            movieData: createMovieObj(
              movie,
              id,
              movie.genres.map((g) => g.name)
            ),
          })
      )
    },
    onError: () =>
      notify('Could not save your change. Please try again.', 'error'),
  })
  // The query is a protected procedure, so only run it when signed in
  const watchlistItem = api.movie.query.useQuery(
    { movieId: id },
    { enabled: !!session }
  )

  const setState = api.movie.setState.useMutation({
    onSuccess: invalidateWatchlist,
    onError: (e) => notify(e.message, 'error'),
  })
  const history = api.diary.history.useQuery(
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
  const handleSeenMovie = (userRating: number) =>
    setState.mutate({
      movieId: id,
      userRating: userRating || null,
      ...(userRating ? { watched: true } : {}),
    })
  const item = watchlistItem.data?.movie[0]
  const onWatchlist = !!item?.inWatchlist
  const currentUserRating = item?.userRating || 0

  return (
    <article className="pb-32 text-white sm:pb-24">
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
          <div className="relative mx-auto aspect-[2/3] w-44 shrink-0 overflow-hidden rounded-xl border border-zinc-700 shadow-2xl sm:mx-0 sm:w-60 sm:self-start">
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
                      className="inline-flex min-h-11 items-center rounded-full bg-zinc-800/80 px-3 py-1 text-sm text-zinc-300 transition hover:bg-zinc-700 hover:text-white sm:min-h-0"
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
              <ScoreBadge
                tmdbScore={movie.tomatoMeter}
                tmdbCount={movie.voteCount}
                imdbRating={movie.imdbRating}
                imdbCount={movie.imdbVoteCount}
              />
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

            <Availability key={id} id={id} initial={movie.watchProviders} />
            {/* Watchlist / rating / share actions */}
            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-3">
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
                        disabled={setState.isPending}
                        value={currentUserRating}
                        onChange={handleSeenMovie}
                      />
                    </div>
                    {onWatchlist ? (
                      <button
                        disabled={removeMovie.isPending || addMovie.isPending}
                        className="btn-ghost"
                        onClick={handleRemoveMovie}
                      >
                        Remove from watchlist
                      </button>
                    ) : (
                      <button
                        disabled={removeMovie.isPending || addMovie.isPending}
                        className="btn-brand"
                        onClick={handleAddMovie}
                      >
                        + Add to watchlist
                      </button>
                    )}
                    <button
                      className="btn-ghost"
                      aria-pressed={!!item?.watched}
                      disabled={setState.isPending}
                      onClick={() =>
                        setState.mutate({
                          movieId: id,
                          watched: !item?.watched,
                        })
                      }
                    >
                      {item?.watched ? '✓ Watched' : 'Mark watched'}
                    </button>
                    <button
                      className="btn-ghost"
                      aria-pressed={!!item?.favorite}
                      disabled={setState.isPending}
                      onClick={() =>
                        setState.mutate({
                          movieId: id,
                          favorite: !item?.favorite,
                        })
                      }
                    >
                      {item?.favorite ? '♥ Favorite' : '♡ Favorite'}
                    </button>
                    <DiaryLogButton
                      id={id}
                      movie={movie}
                      initialRating={currentUserRating}
                    />
                    <ListPicker id={id} movie={movie} />
                    <FollowNews subject={movie.name} />
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
        {!!history.data?.length && (
          <section className="surface mt-6 p-5">
            <h2 className="font-semibold">Your history with this film</h2>
            {history.data.slice(0, 3).map((e) => (
              <p key={e.id} className="mt-2 text-sm text-zinc-300">
                {e.watchedAt.toLocaleDateString()} ·{' '}
                {e.rating ? `${e.rating}★` : 'Unrated watch'}
              </p>
            ))}
            <Link
              className="mt-3 inline-block text-sm text-pink-300"
              href="/diary"
            >
              Edit your diary ↗
            </Link>
          </section>
        )}
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
        {movie.cast?.length > 0 && (
          <CastGrid cast={movie.cast.slice(0, 6)} title="Cast" />
        )}
        {movie.cast?.length > 6 && (
          <details className="my-5">
            <summary className="text-pink-300">
              Full cast ({movie.cast.length})
            </summary>
            <CastGrid cast={movie.cast.slice(6)} title="More cast" />
          </details>
        )}
        {movie.crew?.length > 0 && (
          <details className="my-5">
            <summary className="text-pink-300">Explore the crew</summary>
            <CastGrid cast={movie.crew} title="Crew" />
          </details>
        )}

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
      </div>

      {/* More like this — full-bleed carousel outside the padded container */}
      {movie.similar?.length > 0 && (
        <div className="mt-2">
          <MovieRow title="More like this" movies={movie.similar} />
        </div>
      )}

      {/* Sticky mobile action bar */}
      <div className="safe-area-bottom fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-black/90 px-3 pt-3 backdrop-blur sm:hidden">
        {!session ? (
          <button className="btn-brand w-full" onClick={() => signIn()}>
            Sign in to add &amp; rate
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/library" className="btn-ghost !px-3 !py-2 !text-sm">
              Library
            </Link>
            <button
              className="btn-ghost flex-1 !px-3 !py-2 !text-sm"
              onClick={onWatchlist ? handleRemoveMovie : handleAddMovie}
            >
              {onWatchlist ? '✓ Saved' : '+ Watchlist'}
            </button>
            <DiaryLogButton
              id={id}
              movie={movie}
              initialRating={currentUserRating}
            />
          </div>
        )}
      </div>
    </article>
  )
}

export default MovieDetails
