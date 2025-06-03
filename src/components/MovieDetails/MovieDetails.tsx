/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { FC } from 'react'
import type {
  IMovieDetail,
  MovieDetailInterface,
  MovieDetailProps,
} from './types'
import type { UseQueryResult } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import Balancer from 'react-wrap-balancer'
import parse from 'html-react-parser'
import MovieSkeleton from './Skeleton'
import { useQuery } from '@tanstack/react-query'
import { getMovieDetails } from '@/utils/getMovieDetails'
import { api } from '@/utils/api'
import { signIn } from 'next-auth/react'
// @ts-ignore
import ReactStars from 'react-rating-stars-component'
import { createMovieObj } from '@/utils/createMovieObj'
import CastGrid from '../CastGrid/CastGrid'
import { notFound } from 'next/navigation'

const MovieDetails: FC<MovieDetailProps> = ({ id, sessionData }) => {
  const {
    data,
    isLoading,
    isError,
  }: UseQueryResult<MovieDetailInterface, Error> = useQuery<
    MovieDetailInterface,
    Error
  >(['movieDetails', id], () => getMovieDetails(id))
  const queryClient = useQueryClient()


  const addMovie = api.movie.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries()
    },
  })
  const watchlistItem = api.movie.query.useQuery({ movieId: id })
  const removeMovie = api.movie.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries()
    },
  })
  // refactor into better error handling
  if (isError) {
    return (
      <div>
        <p>Please Let Leon know about this error</p>
        <p>Email: leonmarbukh@gmail.com</p>
      </div>
    )
  }
  // improve skeleton animation
  if (isLoading) {
    return <MovieSkeleton />
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore-next-line
  const { movie } = data.data
  const genres: string[] = movie?.genres.map(
    (genre: { name: string }) => genre.name
  )

  if (!movie) {
    return (
      <div>
        <p className="text-center text-4xl text-white ">Movie not found</p>
      </div>
    )
  }

  const handleAddMovie = (
    movie: IMovieDetail,
    id: string,
    genres: string[]
  ) => {
    const movieData = createMovieObj(movie, id, genres)
    addMovie.mutateAsync({ movieData })
  }

  const handleRemoveMovie = (movieId: string) => {
    removeMovie.mutateAsync({ movieId })
  }

  const handleSeenMovie = (
    movie: IMovieDetail,
    id: string,
    genres: string[],
    userRating: number
  ) => {
    const movieData = createMovieObj(movie, id, genres, userRating)
    addMovie.mutateAsync({ movieData })
  }
  //if user has reated movied, remove 'remove from watchlist' button

  const starsConfig = {
    size: 30,
    count: 5,
    value: watchlistItem?.data?.movie[0]?.userRating || 0,
    onChange: (userRating: number) => {
      handleSeenMovie(movie, id, genres, userRating)
    },
  }

  return (
    <div className="container mx-auto px-4 pb-20">
      <div className="container mb-12 grid place-content-start lg:grid-cols-6">
        <div className="pb-12 text-white lg:col-start-1 lg:col-end-4">
          <div className="flex flex-col justify-between md:flex-row">
            <Balancer className="flex pb-2 text-3xl xl:text-5xl">
              {movie.name}
            </Balancer>
            {!!movie.tomatoRating?.iconImage && (
              <div className="flex w-8 items-center sm:w-24">
                <Image
                  src={movie.tomatoRating.iconImage.url as string}
                  height={50}
                  width={50}
                  alt="Movie Backdrop"
                />
                <p className="pl-2 text-lg lg:text-3xl">
                  {movie.tomatoRating.tomatometer}%
                </p>
              </div>
            )}
          </div>
          {!!movie.posterImage && (
            <div className="my-4 flex content-center lg:hidden">
              <Image
                src={movie.posterImage.url}
                height={300}
                width={450}
                priority
                alt="Movie Backdrop"
              />
            </div>
          )}
          <div className="sm:pt-0pb-4 flex pt-2 align-middle">
            <p className="pr-4 text-lg xl:text-xl">
              {movie.releaseDate.slice(0, 4)}
            </p>
            <p className="text-lg xl:text-xl">Directed By {movie.directedBy}</p>
          </div>
          <div></div>
          <p className="pb-4">{movie.synopsis}</p>
          <div className="mb-2 flex flex-col sm:flex-row">
            {movie.durationMinutes && (
              <p className="mr-4">{movie.durationMinutes} minutes</p>
            )}
            <div className="flex">
              {genres.slice(0, 3).map((genre: string, idx: number) => (
                <p key={idx} className="mx-2 first:ml-0 sm:first:ml-2">
                  {genre}
                </p>
              ))}
            </div>
            {!!movie.motionPictureRating && (
              <p className="mr-2 sm:ml-auto">
                Rated: {movie.motionPictureRating.code}
              </p>
            )}
          </div>
          <div className="my-8 flex h-20 flex-col items-baseline	sm:flex-row sm:items-end sm:justify-between">
            {!!watchlistItem.data?.movie.length ? (
              <>
                <ReactStars {...starsConfig} />
                {!watchlistItem.data.movie[0]?.userRating && (
                  <button
                    className="
                    bordered
                    mt-8
                    rounded
                    bg-red-500
                    py-2
                    px-4
                    font-heading
                    text-xl
                    text-white
                    hover:bg-red-700"
                    onClick={() => handleRemoveMovie(id)}
                  >
                    Remove From Watchlist
                  </button>
                )}
              </>
            ) : (
              <>
                {sessionData && <ReactStars {...starsConfig} />}
                <button
                  className="bordered mt-8 rounded bg-blue-500 py-2 px-4 font-heading text-xl text-white hover:bg-blue-600"
                  onClick={
                    sessionData
                      ? () => handleAddMovie(movie, id, genres)
                      : () => signIn()
                  }
                >
                  {sessionData ? (
                    <Balancer>{'Add to Watchlist'}</Balancer>
                  ) : (
                    <Balancer>
                      {'Sign in to Add to Watchlist/Rate Movie'
                  }</Balancer>
                  )}
                </button>
              </>
            )}
          </div>
          {!!movie.cast && <CastGrid cast={movie.cast} />}
        </div>
        {!!movie.posterImage && (
          <div className="hidden lg:col-start-5 lg:col-end-7 lg:inline">
            <Image
              src={movie.posterImage.url}
              height={300}
              width={450}
              priority
              alt="Movie Backdrop"
            />
          </div>
        )}
      </div>
      {!!movie?.tomatoRating?.consensus && (
        <div className="flex w-full">
          <Balancer className="mx-auto mb-8 text-xl text-white md:text-3xl xl:text-5xl">
            {parse(movie.tomatoRating.consensus)}
          </Balancer>
        </div>
      )}
      {!!movie.trailer?.url && (
        <video
          width={1000}
          height={500}
          controls
          poster="/trailer_placeholder.webp"
          className="mx-auto"
        >
          <source src={movie.trailer.url} type="video/mp4" />
        </video>
      )}
    </div>
  )
}

export default MovieDetails
