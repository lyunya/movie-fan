import Image from 'next/image'
import type { FC } from 'react'
import Balancer from 'react-wrap-balancer'
import parse from 'html-react-parser';
import type { MovieDetailInterface, MovieDetailProps } from './types'
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { getMovieDetails } from '@/utils/getMovieDetails';
import MovieSkeleton from './Skeleton';

const MovieDetails: FC<MovieDetailProps> = ({ id, sessionData }) => {
  const { data, isLoading, isError }: UseQueryResult<MovieDetailInterface, Error> = useQuery<MovieDetailInterface, Error>(['movieDetails', id], () => getMovieDetails(id))
  
  if (isError) { 
    return (
      <div>
        <p>Please Let Leon know about this error</p>
        <p>Email: leonmarbukh@gmail.com</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <MovieSkeleton />
    )
  }

  const { movie } = data.data;
  const genres = movie?.genres.map(genre => genre.name)
  
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
                  src={movie.tomatoRating.iconImage.url}
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
          <div className="sm:pt-0pb-4 flex pt-2 align-middle">
            <p className="pr-4 text-lg xl:text-xl">
              {movie.releaseDate.slice(0, 4)}
            </p>
            <p className="text-lg xl:text-xl">Directed By {movie.directedBy}</p>
          </div>
          <div></div>
          <p className="pb-4">{movie.synopsis}</p>
          <div className="flex flex-col sm:flex-row">
            <p className="mr-4">{movie.durationMinutes} minutes</p>
            <div className="flex">
              {genres.splice(0, 3).map((genre, idx) => (
                <p key={idx} className="mx-2 first:ml-0 sm:first:ml-2">
                  {genre}
                </p>
              ))}
            </div>
            {!!movie.motionPictureRating &&
              <p className="mr-2 sm:ml-auto">
              Rated: {movie.motionPictureRating.code}
            </p>}
          </div>
          <button className="bordered mt-8 rounded bg-blue-500 py-2 px-4 font-heading text-xl text-white hover:bg-blue-700">
            {sessionData ? 'Add to Watchlist' : 'Sign In to Add to Watchlist'}
          </button>
        </div>
        {!!movie.posterImage && <div className="lg:col-start-5 lg:col-end-7">
          <Image
            src={movie.posterImage.url}
            height={300}
            width={450}
            alt="Movie Backdrop"
          />
        </div>}
      </div>
      {!!movie?.tomatoRating?.consensus && (
        <div className="flex w-full">
          <Balancer className="mx-auto mb-8 text-xl text-white md:text-3xl xl:text-5xl">
           {parse(movie.tomatoRating.consensus)} 
          </Balancer>
        </div>
      )}
      {!!movie.trailer?.url && (
        <video width={1000} height={500} controls className="mx-auto">
          <source src={movie.trailer.url} type="video/mp4" />
        </video>
      )}
    </div>
  )
}

export default MovieDetails