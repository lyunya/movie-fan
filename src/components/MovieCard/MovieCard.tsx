import type { FC } from 'react'
import type { MovieCardProps } from './types'
import Image from 'next/image'
import Link from 'next/link'

const MovieCard: FC<MovieCardProps> = ({ name, posterImage, emsVersionId }) => {
  return (
    <Link href={`/movie/${emsVersionId}`}>
      <div className="relative  flex min-h-[400px] w-full min-w-[300px] cursor-pointer snap-center flex-col items-center rounded-lg border bg-white sm:mx-4 sm:snap-start xl:min-h-[480px] xl:min-w-[384px]">
        <Image
          className="absolute inset-0 z-0 h-full w-full rounded-lg bg-cover bg-center"
          // @ts-expect-error @typescript-eslint/ban-ts-comment
          src={posterImage?.url || posterImage || '/placeholderposter.png'}
          height={480}
          width={384}
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
