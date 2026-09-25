'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Balancer from 'react-wrap-balancer'
import { useSession, signIn } from 'next-auth/react'
import {
  HiOutlineShare,
  HiCheck,
  HiBookmark,
  HiOutlineBookmark,
} from 'react-icons/hi'

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
import TrailerButton from '@/components/ui/TrailerButton'
import { describeScore } from '@/utils/score'

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

const ScoreBadge = ({ movie }: { movie: IMovieDetail }) => {
  const score = describeScore({
    tmdbScore: movie.tomatoMeter,
    tmdbVotes: movie.voteCount,
    imdbRating: movie.imdbRating,
    imdbVotes: movie.imdbVoteCount,
    releaseDate: movie.releaseDate,
  })
  if (score.kind === 'none')
    return (
      <p
        suppressHydrationWarning
        className="chip border-dashed italic text-zinc-300"
      >
        {score.label}
      </p>
    )
  const usingImdb = score.kind === 'imdb'
  return (
    <div className="flex items-center gap-3">
      <span
        className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-black/40 font-display text-lg font-bold text-white"
        aria-hidden
      >
        {usingImdb ? movie.imdbRating!.toFixed(1) : movie.tomatoMeter}
      </span>
      <div className="leading-tight">
        <p className="font-semibold text-white">
          {usingImdb
            ? `${movie.imdbRating!.toFixed(1)} / 10 on IMDb`
            : `${movie.tomatoMeter}% on TMDB`}
        </p>
        {score.count ? (
          <p className="text-xs text-zinc-400">
            {score.count.toLocaleString('en-US')} ratings
          </p>
        ) : null}
      </div>
    </div>
  )
}

const ShareButton = ({
  copied,
  onShare,
}: {
  copied: boolean
  onShare: () => void
}) => (
  <button className="btn-quiet" onClick={onShare} aria-label="Share this movie">
    {copied ? (
      <>
        <HiCheck className="h-5 w-5 text-green-400" aria-hidden />
        Link copied
      </>
    ) : (
      <>
        <HiOutlineShare className="h-5 w-5" aria-hidden />
        Share
      </>
    )}
  </button>
)

const MovieDetails = ({ id, movie }: { id: string; movie: IMovieDetail }) => {
  const { data: session } = useSession()
  const utils = api.useUtils()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

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
  const poster = movie.posterImage?.url || '/placeholderposter.svg'
  const backdrop = movie.backgroundImage?.url || poster
  const year = movie.releaseDate ? String(movie.releaseDate).slice(0, 4) : null
  const fullReleaseDate = formatFullDate(movie.releaseDate)
  const runtime = formatRuntime(movie.durationMinutes)
  const gallery = (movie.images || []).filter((img) => img?.url)
  // Link directors to their pages when the crew list carries their TMDB id
  const directors = (movie.directedBy || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({
      name,
      id: movie.crew?.find((c) => c.role === 'Director' && c.name === name)?.id,
    }))

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
      <div className="relative isolate">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <Image
            src={backdrop}
            fill
            priority
            sizes="100vw"
            alt=""
            aria-hidden
            className="object-cover object-top opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/85 to-ink/30" />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-ink via-ink/60 to-transparent sm:block" />
        </div>

        <div className="relative mx-auto flex max-w-screen-xl flex-col gap-8 px-4 py-8 sm:flex-row sm:px-8 sm:py-14">
          {/* Poster */}
          <div className="relative mx-auto aspect-[2/3] w-44 shrink-0 overflow-hidden rounded-xl shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10 sm:mx-0 sm:w-64 sm:self-start">
            <Image
              src={poster}
              fill
              priority
              sizes="(max-width: 640px) 45vw, 256px"
              alt={`${movie.name} poster`}
              className="object-cover"
            />
          </div>

          {/* Meta */}
          <div className="min-w-0 flex-1">
            <h1 className="text-4xl font-semibold leading-[1.05] sm:text-6xl">
              <Balancer>{movie.name}</Balancer>
            </h1>
            {movie.consensus && (
              <p className="mt-3 font-display text-lg italic text-pink-100/85 sm:text-xl">
                “{movie.consensus}”
              </p>
            )}

            {/* Fact chips */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {year && <span className="chip">{year}</span>}
              {runtime && <span className="chip">{runtime}</span>}
              {movie.motionPictureRating?.code && (
                <span className="chip">{movie.motionPictureRating.code}</span>
              )}
              {movie.genres.map((genre) =>
                genre.id ? (
                  <Link
                    prefetch={false}
                    key={genre.name}
                    href={`/genre/${toSlug(genre.id, genre.name)}`}
                    className="chip min-h-11 border-transparent bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white sm:min-h-0"
                  >
                    {genre.name}
                  </Link>
                ) : (
                  <span
                    key={genre.name}
                    className="chip border-transparent bg-white/5 text-zinc-300"
                  >
                    {genre.name}
                  </span>
                )
              )}
            </div>

            {/* Score + trailer */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
              <ScoreBadge movie={movie} />
              {movie.trailer?.url && (
                <TrailerButton
                  url={movie.trailer.url}
                  title={movie.name}
                  className="btn-ghost !rounded-full !py-2.5"
                />
              )}
            </div>

            {directors.length > 0 && (
              <p className="mt-6 text-zinc-300">
                <span className="text-zinc-400">Directed by</span>{' '}
                {directors.map((d, i) => (
                  <span key={d.name}>
                    {i > 0 && ', '}
                    {d.id ? (
                      <Link
                        prefetch={false}
                        href={`/person/${toSlug(d.id, d.name)}`}
                        className="font-semibold text-white underline decoration-pink-400/60 underline-offset-4 hover:text-pink-200"
                      >
                        {d.name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-white">{d.name}</span>
                    )}
                  </span>
                ))}
              </p>
            )}

            {movie.synopsis && (
              <p className="mt-3 max-w-2xl leading-relaxed text-zinc-200">
                {movie.synopsis}
              </p>
            )}

            <Availability key={id} id={id} initial={movie.watchProviders} />

            {/* Your panel: primary actions first, the rest quieter */}
            <div className="mt-6">
              {!session ? (
                <div className="flex flex-wrap items-center gap-3">
                  <button className="btn-brand" onClick={() => signIn()}>
                    Sign in to save &amp; rate
                  </button>
                  <ShareButton copied={copied} onShare={handleShare} />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-zinc-400">Your rating</span>
                    <StarRating
                      disabled={setState.isPending}
                      value={currentUserRating}
                      onChange={handleSeenMovie}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      disabled={removeMovie.isPending || addMovie.isPending}
                      className={onWatchlist ? 'btn-ghost' : 'btn-brand'}
                      aria-pressed={onWatchlist}
                      onClick={onWatchlist ? handleRemoveMovie : handleAddMovie}
                    >
                      {onWatchlist ? (
                        <HiBookmark
                          className="h-5 w-5 text-pink-300"
                          aria-hidden
                        />
                      ) : (
                        <HiOutlineBookmark className="h-5 w-5" aria-hidden />
                      )}
                      {onWatchlist ? 'On your watchlist' : 'Add to watchlist'}
                    </button>
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
                    <DiaryLogButton
                      id={id}
                      movie={movie}
                      initialRating={currentUserRating}
                    />
                  </div>
                  <div className="quiet-actions -ml-3 flex flex-wrap items-center gap-1">
                    <button
                      className="btn-quiet"
                      aria-pressed={!!item?.favorite}
                      disabled={setState.isPending}
                      onClick={() =>
                        setState.mutate({
                          movieId: id,
                          favorite: !item?.favorite,
                        })
                      }
                    >
                      <span
                        aria-hidden
                        className={item?.favorite ? 'text-pink-400' : ''}
                      >
                        {item?.favorite ? '♥' : '♡'}
                      </span>
                      {item?.favorite ? 'Favorite' : 'Add to favorites'}
                    </button>
                    <ListPicker id={id} movie={movie} />
                    <FollowNews subject={movie.name} />
                    <ShareButton copied={copied} onShare={handleShare} />
                  </div>
                </div>
              )}
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
