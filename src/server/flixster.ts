/**
 * Server-only Flixster fetchers. The RapidAPI key comes from the validated
 * server env, so this module must never be imported into client code. Both
 * the tRPC flixster router and the App Router Server Components use it.
 *
 * Cache windows are deliberately long: the RapidAPI plan has a hard monthly
 * quota, and every timer-based revalidation spends against it whether or not
 * anyone is looking. Movie facts are effectively static, so they're cached
 * for a week; the "popular"/"opening" lists refresh twice a day, which is
 * plenty for a "today"/"this week" surface.
 */
import { cache } from 'react'
import { env } from '../env/server.mjs'
import {
  RAPID_API_HOST,
  FLIXSTER_API_POPULAR_URL,
  FLIXSTER_API_UPCOMING_URL,
  FLIXSTER_API_SEARCH_URL,
  FLIXSTER_API_MOVIE_DETAILS_URL,
} from '@/data/Constants'

// Cache lifetimes in seconds (see module note on quota)
export const REVALIDATE = {
  popular: 43_200, // 12h
  upcoming: 86_400, // 24h
  details: 604_800, // 7d — movie metadata basically never changes
  search: 86_400, // 24h — results for a given query are stable
} as const

const headers = {
  'X-RapidAPI-Key': env.RAPID_API_KEY,
  'X-RapidAPI-Host': RAPID_API_HOST,
}

// revalidate is the Next data-cache lifetime in seconds
const fetchFlixster = async (url: string, revalidate: number) => {
  const res = await fetch(url, { headers, next: { revalidate } })
  if (!res.ok) {
    throw new Error(`Flixster request failed (${res.status})`)
  }
  return res.json()
}

export const fetchPopular = async () => {
  const data = await fetchFlixster(FLIXSTER_API_POPULAR_URL, REVALIDATE.popular)
  return {
    opening: data?.data?.opening ?? [],
    popularity: data?.data?.popularity ?? [],
  }
}

export const fetchUpcoming = async () => {
  const data = await fetchFlixster(
    FLIXSTER_API_UPCOMING_URL,
    REVALIDATE.upcoming
  )
  return data?.data?.upcoming ?? []
}

export const fetchSearch = async (query: string) => {
  const data = await fetchFlixster(
    `${FLIXSTER_API_SEARCH_URL}${encodeURIComponent(query)}`,
    REVALIDATE.search
  )
  return data?.data?.search?.movies ?? []
}

// Wrapped in React cache() so the movie page's generateMetadata and the page
// component share a single call within one request instead of hitting the
// API (or even the data cache) twice per render.
export const fetchDetails = cache(async (id: string) => {
  const data = await fetchFlixster(
    `${FLIXSTER_API_MOVIE_DETAILS_URL}${encodeURIComponent(id)}`,
    REVALIDATE.details
  )
  return data?.data?.movie ?? null
})
