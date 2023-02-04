import type { FC } from 'react'
import type { MovieCardProps } from './types'
import Image from 'next/image'
import Link from 'next/link'

const MovieCard: FC<MovieCardProps> = ({ name, posterImage, emsVersionId }) => {
  return (
    <Link href={`/movie/${emsVersionId}`}>
      <div className="relative flex aspect-[489/725] h-72 max-h-96 max-w-[195] cursor-pointer snap-center flex-col items-center rounded-lg border bg-white sm:mx-4 sm:snap-start">
        <Image
          className="absolute inset-0 z-0 rounded-lg bg-cover bg-center"
          // @ts-expect-error @typescript-eslint/ban-ts-comment
          src={posterImage?.url || posterImage || '/placeholderposter.png'}
          fill
          sizes="(max-width: 768px) 75vw,
            (max-width: 1200px) 25vw,
            20vw"
          alt="movie poster"
        />
        <div className="absolute inset-0	 z-10 grid h-full place-items-center items-center  rounded-lg p-4 text-white opacity-0 hover:from-cyan-500 hover:to-blue-500 md:hover:bg-gradient-to-r lg:hover:opacity-90">
          <h2 className="mb-4 text-center text-3xl">{name}</h2>
        </div>
      </div>
    </Link>
  )
}

export default MovieCard
