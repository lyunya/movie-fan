import type { FC } from 'react'
import type { MovieGridProps } from './types'

const MovieGrid: FC<MovieGridProps> = ({ movieCards }) => {
  return (
    <div className="my-6 mx-auto grid grid-cards justify-center gap-y-12">
      {movieCards}
    </div>
  )
}

export default MovieGrid
