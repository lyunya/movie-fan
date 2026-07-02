import type { HomeData } from '@/types/main'
import { fetchPopular, fetchUpcoming } from '@/server/flixster'
import { fetchNews } from '@/server/news'
import HomeClient from './HomeClient'

// ISR: rebuild the home data at most once an hour
export const revalidate = 3600

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
