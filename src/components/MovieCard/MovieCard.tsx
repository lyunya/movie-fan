import type { FC } from 'react'
import type { MovieCardProps } from './types'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { TMDB_POSTER_URL } from '@/data/Contstants'
import { getMovieDetails } from '@/utils/getMovieDetails'
import { convertRunTime } from '@/utils/convertRunTime'
import Link from 'next/link'

const MovieCard: FC<MovieCardProps> = ({ title, poster_path, id }) => {
  const { isLoading, isError, data, error } = useQuery(['movieDetails', id], () => getMovieDetails(id));
   
  if (isLoading) {
    return <span>Loading...</span>
  }
  
  if (isError) {
    return <>Error: {error}</>
  }

  const { runtime, overview, backdrop_path, tagline, imdb_id } = data;

  const genresList = data.genres.slice(0, 2).map((genre: { name: string }) => genre.name);
  
  return (
    <Link href={{pathname: `/movie/${id}`, query: {title, poster_path, overview, id, backdrop_path, tagline, imdb_id} }}>
    <div className='flex h-[400px] w-[300px] flex-col relative items-center bg-white border rounded-lg md:flex-row cursor-pointer'>
        <Image className='h-full absolute inset-0 bg-cover bg-center z-0 rounded-lg' src={`${TMDB_POSTER_URL}${poster_path}`} height={400} width={300} alt='movie poster' />
      <div className='grid place-items-center	 h-full p-4 items-center opacity-0 hover:opacity-90  absolute inset-0 z-10 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg'>
      <h2 className='mb-4 text-center text-3xl'>{title}</h2>
        <div className='mt-auto text-center'>
        <p className='flex w-fit justify-between mt-auto text-xl'>
          {genresList.map((genre: string, idx: number) => {
          return <span className='px-2' key={idx}>{genre}</span>
        })}
          </p>
          <p className='py-2 text-xl'>{convertRunTime(runtime)}</p>
          </div>
      </div>
    </div>
    </Link>
  ) 
}

export default MovieCard