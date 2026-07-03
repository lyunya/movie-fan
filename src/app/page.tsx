import { Suspense } from 'react'
import type { HomeData } from '@/types/main'
import {
  fetchPopular,
  fetchNowPlaying,
  fetchUpcoming,
  fetchTrending,
  fetchTopRated,
} from '@/server/tmdb'
import { fetchNews } from '@/server/news'
import HomeClient from './HomeClient'

// ISR: rebuild the home data periodically. The per-fetch cache windows in
// src/server/tmdb.ts govern the finer-grained freshness of each section.
export const revalidate = 21600

export default async function Page() {
  // Each source falls back independently so one failing call can't blank the page
  const [popularRes, nowPlayingRes, upcomingRes, trendingRes, topRatedRes, newsRes] =
    await Promise.allSettled([
      fetchPopular(),
      fetchNowPlaying(),
      fetchUpcoming(),
      fetchTrending('week'),
      fetchTopRated(),
      fetchNews(),
    ])

  for (const result of [
    popularRes,
    nowPlayingRes,
    upcomingRes,
    trendingRes,
    topRatedRes,
    newsRes,
  ]) {
    if (result.status === 'rejected') console.error(result.reason)
  }

  const data: HomeData = {
    popular: popularRes.status === 'fulfilled' ? popularRes.value : [],
    opening: nowPlayingRes.status === 'fulfilled' ? nowPlayingRes.value : [],
    upcoming: upcomingRes.status === 'fulfilled' ? upcomingRes.value : [],
    trending: trendingRes.status === 'fulfilled' ? trendingRes.value : [],
    topRated: topRatedRes.status === 'fulfilled' ? topRatedRes.value : [],
    news: newsRes.status === 'fulfilled' ? newsRes.value : [],
  }

  // useSearchParams in HomeClient requires a Suspense boundary
  return (
    <Suspense>
      <HomeClient data={data} />
    </Suspense>
  )
}
