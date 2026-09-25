import type { Metadata } from 'next'
import { catalog } from '@/server/catalog'
import { filmImage, filmYear } from '@/utils/film'
import type { FrameFilm } from '@/utils/frameGame'
import FrameGame from '@/components/FrameGame/FrameGame'

// The pool only needs to change about as often as the lists behind it. This
// page is static between regenerations, so playing costs no function calls.
export const revalidate = 43200

export const metadata: Metadata = {
  title: 'The Frame Game',
  description:
    'Name the film from a single out-of-focus frame. Ten stills a day. Guess early for more points.',
  openGraph: {
    title: 'The Frame Game · Movie Fan',
    description: 'Name the film from a single out-of-focus frame.',
  },
}

export default async function PlayPage() {
  const lists = await Promise.allSettled([
    catalog.films('topRated'),
    catalog.films('popular'),
    catalog.films('trendingWeek'),
  ])
  const pool: FrameFilm[] = lists
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .filter((m) => m.backdropPath && m.title)
    .map((m) => ({
      id: m.id,
      name: m.title,
      year: filmYear(m),
      backdropUrl: filmImage(m.backdropPath, 'w780')!,
      genreIds: m.genreIds,
    }))
  return <FrameGame pool={pool} />
}
