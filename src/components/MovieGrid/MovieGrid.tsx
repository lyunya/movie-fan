import type { FC } from 'react'
import type { MovieGridProps } from './types'

const MovieGrid: FC<MovieGridProps> = ({ movieCards }) => {
  return (
    <div className="my-12 mx-auto flex w-full flex-wrap flex-start justify-evenly gap-8	sm:w-11/12 ">
      {movieCards}
    </div>
  )
}

export default MovieGrid
