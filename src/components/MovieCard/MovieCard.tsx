import type { FC } from 'react'
import type { MovieCardProps } from './types'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { TMDB_POSTER_URL } from '@/data/Contstants'
import { getMovieDetails } from '@/utils/getMovieDetails'
import { convertRunTime } from '@/utils/convertRunTime'

const MovieCard: FC<MovieCardProps> = ({ title, poster_path, overview, id }) => {
  const { isLoading, isError, data, error } = useQuery(['movieDetails', id], () => getMovieDetails(id));
   
  if (isLoading) {
    return <span>Loading...</span>
  }
  
  if (isError) {
    return <>Error: {error}</>
  }

  const genresList = data.genres.map((genre: { name: string }) => genre.name);
  const runTime = data.runtime;
  
  return (
    <div className='flex flex-col items-center bg-white border rounded-lg md:flex-row'>
     <div className='w-1/3 h-full'>
        <Image src={`${TMDB_POSTER_URL}${poster_path}`} height={350} width={250} alt='movie poster' />
      </div>
      <div className='flex flex-col w-2/3 h-full p-4 items-center'>
      <h2 className='mb-4 text-center text-2xl'>{title}</h2>
        <p className='line-clamp-5 text-md'>{overview}</p>
        <div className='mt-auto text-center'>
        <p className='flex w-fit justify-between mt-auto'>
          {genresList.map((genre: string, idx: number) => {
          return <span className='px-2' key={idx}>{genre}</span>
        })}
          </p>
          <p className='py-2'>{convertRunTime(runTime)}</p>
          </div>
      </div>

    </div>
  ) 
}

export default MovieCard