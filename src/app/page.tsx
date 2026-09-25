import { Suspense } from 'react'
import type { HomeData } from '@/types/main'
import { catalog, type Film, type FilmDetail } from '@/server/catalog'
import { fetchNews } from '@/server/news'
import HomeClient from './HomeClient'

// ISR: rebuild the home data periodically. The Catalog's per-request cache
// windows govern the finer-grained freshness of each section.
export const revalidate = 21600

export default async function Page() {
  // Each source falls back independently so one failing call can't blank the page
  const [
    popularRes,
    nowPlayingRes,
    upcomingRes,
    trendingRes,
    topRatedRes,
    newsRes,
  ] = await Promise.allSettled([
    catalog.films('popular'),
    catalog.films('nowPlaying'),
    catalog.films('upcoming'),
    catalog.films('trendingWeek'),
    catalog.films('topRated'),
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

  const popular = popularRes.status === 'fulfilled' ? popularRes.value : []
  const data: HomeData = {
    popular,
    opening: nowPlayingRes.status === 'fulfilled' ? nowPlayingRes.value : [],
    upcoming: upcomingRes.status === 'fulfilled' ? upcomingRes.value : [],
    trending: trendingRes.status === 'fulfilled' ? trendingRes.value : [],
    topRated: topRatedRes.status === 'fulfilled' ? topRatedRes.value : [],
    news: newsRes.status === 'fulfilled' ? newsRes.value : [],
    feature: await pickFeature(popular),
  }

  // useSearchParams in HomeClient requires a Suspense boundary
  return (
    <Suspense>
      <HomeClient data={data} />
    </Suspense>
  )
}

/**
 * The marquee film: the most popular title that has artwork. One extra
 * (cached, ISR-bound) detail lookup buys a tagline, runtime, director, and
 * trailer so the feature can say something real about it.
 */
async function pickFeature(popular: Film[]): Promise<FilmDetail | null> {
  const candidate = popular.find((m) => m.backdropPath && m.posterPath)
  if (!candidate) return null
  const film = await catalog.filmDetail(candidate.id).catch(() => null)
  if (!film?.backdropPath) return null
  // The marquee shows none of these; keep them out of the page payload
  return { ...film, cast: [], crew: [], stills: [], similar: [] }
}
