import type { FC } from 'react'
import type { MovieGridProps } from './types'

const MovieGrid: FC<MovieGridProps> = ({ movieCards }) => {
  return (
    <div className="mx-auto flex w-full max-w-screen-xl flex-wrap justify-center gap-x-4 gap-y-8">
      {movieCards}
    </div>
  )
}

export default MovieGrid
