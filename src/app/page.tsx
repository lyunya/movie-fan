import type { HomeData } from '@/types/main'
import { fetchPopular, fetchUpcoming } from '@/server/flixster'
import { fetchNews } from '@/server/news'
import HomeClient from './HomeClient'

// ISR: rebuild the home data at most twice a day. Kept long on purpose —
// each rebuild spends against the Flixster API's monthly quota even with no
// traffic (see src/server/flixster.ts). The per-fetch cache windows there
// govern the finer-grained freshness of each section.
export const revalidate = 43200

export default async function Page() {
  // Each source falls back independently so one failing call can't blank the page
  const [popularRes, upcomingRes, newsRes] = await Promise.allSettled([
    fetchPopular(),
    fetchUpcoming(),
    fetchNews(),
  ])

  for (const result of [popularRes, upcomingRes, newsRes]) {
    if (result.status === 'rejected') console.error(result.reason)
  }

  const popular =
    popularRes.status === 'fulfilled'
      ? popularRes.value
      : { opening: [], popularity: [] }

  const data: HomeData = {
    popular: popular.popularity,
    opening: popular.opening,
    upcoming: upcomingRes.status === 'fulfilled' ? upcomingRes.value : [],
    news: newsRes.status === 'fulfilled' ? newsRes.value : [],
  }

  return <HomeClient data={data} />
}
