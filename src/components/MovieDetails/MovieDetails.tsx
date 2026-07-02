/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FC } from 'react'
import type { IMovieDetail, MovieDetailProps } from './types'
import Image from 'next/image'
import Balancer from 'react-wrap-balancer'
import parse, { domToReact } from 'html-react-parser'
import MovieSkeleton from './Skeleton'
import { api } from '@/utils/api'
import { signIn } from 'next-auth/react'
// @ts-ignore
import ReactStars from 'react-rating-stars-component'
import { createMovieObj } from '@/utils/createMovieObj'
import CastGrid from '../CastGrid/CastGrid'

const formatRuntime = (minutes?: number | null) => {
  if (!minutes) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const ScoreBadge = ({
  iconUrl,
  score,
  count,
  suffix = '%',
}: {
  iconUrl?: string
  score?: number | null
  count?: number | null
  suffix?: string
}) => {
  if (score == null) return null
  return (
    <div className="flex items-center gap-2">
      {iconUrl && (
        <Image src={iconUrl} height={28} width={28} alt="" className="h-7 w-7" />
      )}
      <div className="leading-tight">
        <p className="text-lg font-bold text-white">
          {score}
          {suffix}
        </p>
        {count ? (
          <p className="text-xs text-zinc-400">
            {count.toLocaleString()} ratings
          </p>
        ) : null}
      </div>
    </div>
  )
}

const MovieDetails: FC<MovieDetailProps> = ({ id, sessionData }) => {
  const { data, isLoading, isError } = api.flixster.details.useQuery(
    { id },
    // retry is capped so a failing lookup doesn't burn RapidAPI quota
    { retry: 1 }
  )
  const utils = api.useContext()

  const invalidateWatchlist = () => {
    utils.movie.query.invalidate({ movieId: id })
    utils.user.query.invalidate()
  }

  const addMovie = api.movie.create.useMutation({ onSuccess: invalidateWatchlist })
  // The query is a protected procedure, so only run it when signed in
  const watchlistItem = api.movie.query.useQuery(
    { movieId: id },
    { enabled: !!sessionData }
  )
  const removeMovie = api.movie.delete.useMutation({ onSuccess: invalidateWatchlist })

  if (isError) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-white">
        <p className="mb-2 text-2xl font-bold">Something went wrong</p>
        <p className="text-zinc-400">
          Please let Leon know at{' '}
          <a className="text-pink-400 underline" href="mailto:leonmarbukh@gmail.com">
            leonmarbukh@gmail.com
          </a>
        </p>
      </div>
    )
  }

  if (isLoading) return <MovieSkeleton />

  const movie: any = data?.movie

  if (!movie) {
    return (
      <p className="px-4 py-20 text-center text-4xl text-white">Movie not found</p>
    )
  }

  const genres: string[] = (movie.genres || []).map(
    (genre: { name: string }) => genre.name
  )
  const poster = movie.posterImage?.url || '/placeholderposter.png'
  const backdrop = movie.backgroundImage?.url || poster
  const year = movie.releaseDate ? String(movie.releaseDate).slice(0, 4) : null
  const runtime = formatRuntime(movie.durationMinutes)
  const gallery = (movie.images || []).slice(0, 8)
  const theaters = movie.showtimeGroupings?.theaters || []
  const ticketsUrl = `https://www.fandango.com/search?q=${encodeURIComponent(
    movie.name
  )}`

  const handleAddMovie = () => {
    addMovie.mutate({ movieData: createMovieObj(movie as IMovieDetail, id, genres) })
  }
  const handleRemoveMovie = () => removeMovie.mutate({ movieId: id })
  // The server upserts on [userId, movieId], so rating a movie is a single
  // mutation whether or not it is already on the watchlist
  const handleSeenMovie = (userRating: number) => {
    addMovie.mutate({
      movieData: createMovieObj(movie as IMovieDetail, id, genres, userRating),
    })
  }

  const onWatchlist = !!watchlistItem.data?.movie.length
  const currentUserRating = watchlistItem.data?.movie[0]?.userRating || 0
  const starsConfig = {
    size: 32,
    count: 5,
    isHalf: false,
    value: currentUserRating,
    activeColor: '#facc15',
    color: '#3f3f46',
    onChange: (userRating: number) => handleSeenMovie(userRating),
  }

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
            className="object-cover object-top brightness-[0.3] blur-sm"
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
                <span
                  className="chip"
                  title={movie.motionPictureRating.description || undefined}
                >
                  {movie.motionPictureRating.code}
                </span>
              )}
              {movie.availabilityWindow && (
                <span className="chip border-pink-700/60 bg-pink-950/40 text-pink-200">
                  {movie.availabilityWindow}
                </span>
              )}
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full bg-zinc-800/80 px-3 py-1 text-sm text-zinc-300"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Scores */}
            <div className="mt-5 flex flex-wrap items-center gap-6">
              <ScoreBadge
                iconUrl={movie.tomatoRating?.iconImage?.url}
                score={movie.tomatoRating?.tomatometer}
                count={movie.tomatoRating?.ratingCount}
              />
              <ScoreBadge
                iconUrl={movie.userRating?.iconImage?.url}
                score={movie.userRating?.dtlLikedScore}
                count={movie.userRating?.ratingCount}
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

            {/* Watchlist / rating actions */}
            <div className="mt-8">
              {!sessionData ? (
                <button className="btn-brand" onClick={() => signIn()}>
                  Sign in to add to watchlist &amp; rate
                </button>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-400">Your rating:</span>
                    <ReactStars key={currentUserRating} {...starsConfig} />
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-xl px-4 sm:px-8">
        {/* Critics' consensus */}
        {movie.tomatoRating?.consensus && (
          <blockquote className="surface my-8 border-l-4 border-pink-500 p-5 text-lg italic text-zinc-200 md:text-xl">
            <Balancer>
              {parse(movie.tomatoRating.consensus, {
                replace(domNode: any) {
                  if (
                    domNode.type === 'tag' &&
                    !['em', 'strong', 'b', 'i'].includes(domNode.name)
                  ) {
                    return <>{domToReact(domNode.children || [])}</>
                  }
                },
              })}
            </Balancer>
          </blockquote>
        )}

        {/* Trailer */}
        {movie.trailer?.url && (
          <section className="my-10">
            <h3 className="section-heading mb-4">Trailer</h3>
            <video
              controls
              poster={backdrop}
              className="aspect-video w-full rounded-xl border border-zinc-800 bg-black"
            >
              <source src={movie.trailer.url} type="video/mp4" />
            </video>
          </section>
        )}

        {/* Photo gallery */}
        {gallery.length > 0 && (
          <section className="my-10">
            <h3 className="section-heading mb-4">Photos</h3>
            <div className="hide-scrollbar edge-fade-x flex gap-4 overflow-x-auto pb-2">
              {gallery.map((img: any, idx: number) => (
                <div
                  key={idx}
                  className="relative aspect-video h-40 shrink-0 overflow-hidden rounded-lg border border-zinc-800 sm:h-52"
                >
                  <Image
                    src={img.url}
                    fill
                    sizes="360px"
                    alt={`${movie.name} still ${idx + 1}`}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cast & crew */}
        {movie.cast && <CastGrid cast={movie.cast} title="Cast" />}
        {movie.crew && <CastGrid cast={movie.crew} title="Crew" />}

        {/* Where to watch */}
        {theaters.length > 0 && (
          <section className="my-10">
            <h3 className="section-heading mb-4">Where to watch</h3>
            <div className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-zinc-300">
                Playing in{' '}
                <span className="font-semibold text-white">
                  {theaters.length}
                </span>{' '}
                {theaters.length === 1 ? 'theater' : 'theaters'} near you
              </p>
              <a
                href={ticketsUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-brand"
              >
                Get tickets on Fandango
              </a>
            </div>
          </section>
        )}
      </div>

      {/* Sticky mobile action bar — keeps the primary action reachable while
          scrolling through cast, photos, and showtimes */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-black/90 p-3 backdrop-blur sm:hidden">
        {!sessionData ? (
          <button className="btn-brand w-full" onClick={() => signIn()}>
            Sign in to add &amp; rate
          </button>
        ) : onWatchlist ? (
          <button className="btn-ghost w-full" onClick={handleRemoveMovie}>
            Remove from watchlist
          </button>
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
