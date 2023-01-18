import type { FC } from 'react'
import type { MovieGridProps } from './types'

const MovieGrid: FC<MovieGridProps> = ({ movieCards }) => {
  return (
    <div className="my-12 mx-auto grid grid-cards gap-8 justify-center ">
      {movieCards}
    </div>
  )
}

export default MovieGrid
