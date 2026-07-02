import type { FC } from 'react'
import CastCard from '../CastCard/CastCard'
import type { CastGridProps } from './types'

const CastGrid: FC<CastGridProps> = ({ cast, title = 'Cast' }) => {
  if (!cast?.length) return null
  return (
    <section className="my-10 text-white">
      <h3 className="section-heading mb-4">{title}</h3>
      {/* Horizontal scroll on mobile, grid on larger screens */}
      <div className="hide-scrollbar edge-fade-x flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:gap-x-4 sm:gap-y-6 sm:overflow-visible lg:grid-cols-6">
        {cast.map((castMember, idx) => (
          <CastCard key={`${castMember.id}-${idx}`} {...castMember} />
        ))}
      </div>
    </section>
  )
}

export default CastGrid
