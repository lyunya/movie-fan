import type { FC } from 'react'
import type { MovieCardProps } from './types'
import Image from 'next/image'
import { TMDB_POSTER_URL } from '@/data/Contstants'

const MovieCard: FC<MovieCardProps> = ({ title, poster_path, overview }) => {
  // const { title } = props

  return (
    <div className='flex flex-col items-center bg-white border rounded-lg md:flex-row'>
     <div className='w-1/2 h-full'>
        <Image src={`${TMDB_POSTER_URL}${poster_path}`} height={800} width={700} alt='movie poster' />
      </div>
      <div className='flex flex-col w-1/2'>
      <h2 className='mb-4'>{title}</h2>
      <p className='line-clamp-3'>{overview}</p>
      </div>

    </div>
  ) 
}

export default MovieCard