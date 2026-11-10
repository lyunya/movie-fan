import { Suspense } from 'react'
import type { HomeData } from '@/types/main'
import { catalog, type Film, type FilmDetail } from '@/server/catalog'
import { fetchNews } from '@/server/news'
import { featureCandidates } from '@/utils/feature'
import HomeClient from './HomeClient'

// ISR: an upper bound. Next uses the shortest fetch lifetime on the page, so
// the 30-minute news feed is what actually sets the rebuild interval.
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
 * The marquee film: one of the ten most popular titles with artwork, a new
 * one each day (see featureCandidates). One extra cached detail lookup buys a
 * tagline, runtime, director, and trailer so the feature can say something
 * real about it. If the day's pick can't be loaded, the next in line stands in.
 *
 * This page is rebuilt at least every 30 minutes, so the feature turns over
 * shortly after midnight UTC without any per-request work.
 */
async function pickFeature(popular: Film[]): Promise<FilmDetail | null> {
  for (const candidate of featureCandidates(popular).slice(0, 3)) {
    const film = await catalog.filmDetail(candidate.id).catch(() => null)
    if (!film?.backdropPath) continue
    // The marquee shows none of these; keep them out of the page payload
    return { ...film, cast: [], crew: [], stills: [], similar: [] }
  }
  return null
}
