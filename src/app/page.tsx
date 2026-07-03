import type { HomeData } from '@/types/main'
import { fetchPopular, fetchNowPlaying, fetchUpcoming } from '@/server/tmdb'
import { fetchNews } from '@/server/news'
import HomeClient from './HomeClient'

// ISR: rebuild the home data periodically. The per-fetch cache windows in
// src/server/tmdb.ts govern the finer-grained freshness of each section.
export const revalidate = 21600

export default async function Page() {
  // Each source falls back independently so one failing call can't blank the page
  const [popularRes, nowPlayingRes, upcomingRes, newsRes] = await Promise.allSettled([
    fetchPopular(),
    fetchNowPlaying(),
    fetchUpcoming(),
    fetchNews(),
  ])

  for (const result of [popularRes, nowPlayingRes, upcomingRes, newsRes]) {
    if (result.status === 'rejected') console.error(result.reason)
  }

  const data: HomeData = {
    popular: popularRes.status === 'fulfilled' ? popularRes.value : [],
    opening: nowPlayingRes.status === 'fulfilled' ? nowPlayingRes.value : [],
    upcoming: upcomingRes.status === 'fulfilled' ? upcomingRes.value : [],
    news: newsRes.status === 'fulfilled' ? newsRes.value : [],
  }

  return <HomeClient data={data} />
}
