import { Suspense } from 'react'
import type { HomeData, HomeFeature } from '@/types/main'
import {
  fetchPopular,
  fetchNowPlaying,
  fetchUpcoming,
  fetchTrending,
  fetchTopRated,
  fetchMovieDetails,
} from '@/server/tmdb'
import { fetchNews } from '@/server/news'
import HomeClient from './HomeClient'
import { describeScore } from '@/utils/score'

// ISR: rebuild the home data periodically. The per-fetch cache windows in
// src/server/tmdb.ts govern the finer-grained freshness of each section.
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
 * The marquee film: the most popular title that has artwork and a synopsis.
 * One extra (cached, ISR-bound) details call buys a tagline, runtime,
 * director, and trailer so the feature can say something real about it.
 */
async function pickFeature(
  popular: Awaited<ReturnType<typeof fetchPopular>>
): Promise<HomeFeature | null> {
  const candidate = popular.find((m) => m.backdropUrl && m.posterImage?.url)
  if (!candidate) return null
  const movie = await fetchMovieDetails(candidate.emsVersionId).catch(
    () => null
  )
  if (!movie?.backgroundImage.url) return null
  return {
    id: movie.id,
    name: movie.name,
    tagline: movie.consensus,
    synopsis: movie.synopsis,
    backdropUrl: movie.backgroundImage.url,
    posterUrl: movie.posterImage.url,
    year: movie.releaseDate?.slice(0, 4) || null,
    runtimeMinutes: movie.durationMinutes || null,
    genres: movie.genres.map((g) => g.name).slice(0, 3),
    director: movie.directedBy || null,
    certification: movie.motionPictureRating.code,
    trailerUrl: movie.trailer.url,
    score: describeScore({
      tmdbScore: movie.tomatoMeter,
      tmdbVotes: movie.voteCount,
      imdbRating: movie.imdbRating,
      imdbVotes: movie.imdbVoteCount,
      releaseDate: movie.releaseDate,
    }).label,
  }
}
