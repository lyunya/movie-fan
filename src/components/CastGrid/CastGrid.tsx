import type { Credit } from '@/server/catalog/types'
import CastCard from '../CastCard/CastCard'

export default function CastGrid({
  cast,
  title = 'Cast',
}: {
  cast: Credit[]
  title?: string
}) {
  if (!cast?.length) return null
  return (
    <section className="my-10 text-white">
      <h3 className="section-heading mb-4">{title}</h3>
      {/* Horizontal scroll on mobile, grid on larger screens */}
      <div className="hide-scrollbar edge-fade-x flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:gap-x-4 sm:gap-y-6 sm:overflow-visible lg:grid-cols-6">
        {cast.map((credit, idx) => (
          <CastCard key={`${credit.personId}-${idx}`} credit={credit} />
        ))}
      </div>
    </section>
  )
}
