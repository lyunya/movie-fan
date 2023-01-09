import type { FC } from 'react'
import type { MovieCardProps } from './types'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { getMovieDetails } from '@/utils/getMovieDetails'
import Link from 'next/link'

const MovieCard: FC<MovieCardProps> = ({ name, posterImage, emsVersionId }) => {
  // const { isLoading, isError, data, error } = useQuery(['movieDetails', emsVersionId], () => getMovieDetails(emsVersionId));
   
  // if (isLoading) {
  //   return <span>Loading...</span>
  // }
  
  // if (isError) {
  //   return <>Error: {error}</>
  // }

  // console.log(data, 'here is data')

  // const { runtime, overview, backdrop_path, tagline, imdb_id } = data;

  
  return (
    <Link href={`/movie/${emsVersionId}`}>
    <div className='flex min-h-[480px] min-w-[384px] flex-col relative items-center bg-white border rounded-lg cursor-pointer snap-start mx-4'>
        <Image className='h-full absolute inset-0 bg-cover bg-center z-0 rounded-lg' src={posterImage.url} height={480} width={384} alt='movie poster' />
      <div className='grid place-items-center	 h-full p-4 items-center opacity-0 hover:opacity-90  absolute inset-0 z-10 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg'>
      <h2 className='mb-4 text-center text-3xl'>{name}</h2>
        {/* <div className='mt-auto text-center'>
        <p className='flex w-fit justify-between mt-auto text-xl'>
          {genresList.map((genre: string, idx: number) => {
          return <span className='px-2' key={idx}>{genre}</span>
        })}
          </p>
          <p className='py-2 text-xl'>{convertRunTime(runtime)}</p>
          </div> */}
      </div>
    </div>
    </Link>
  ) 
}

export default MovieCard