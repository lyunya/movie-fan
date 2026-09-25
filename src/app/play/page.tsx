import type { Metadata } from 'next'
import { fetchPopular, fetchTopRated, fetchTrending } from '@/server/tmdb'
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
    fetchTopRated(),
    fetchPopular(),
    fetchTrending('week'),
  ])
  const pool: FrameFilm[] = lists
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .filter((m) => m.backdropUrl && m.name)
    .map((m) => ({
      id: m.emsVersionId,
      name: m.name,
      year: m.releaseDate?.slice(0, 4) || null,
      backdropUrl: m.backdropUrl as string,
      genreIds: m.genreIds || [],
    }))
  return <FrameGame pool={pool} />
}
