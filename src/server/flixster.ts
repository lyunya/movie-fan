/**
 * Server-only Flixster fetchers. The RapidAPI key comes from the validated
 * server env, so this module must never be imported into client code. Both
 * the tRPC flixster router and the App Router Server Components use it.
 */
import { env } from '../env/server.mjs'
import {
  RAPID_API_HOST,
  FLIXSTER_API_POPULAR_URL,
  FLIXSTER_API_UPCOMING_URL,
  FLIXSTER_API_SEARCH_URL,
  FLIXSTER_API_MOVIE_DETAILS_URL,
} from '@/data/Constants'

const headers = {
  'X-RapidAPI-Key': env.RAPID_API_KEY,
  'X-RapidAPI-Host': RAPID_API_HOST,
}

// revalidate is the Next data-cache lifetime in seconds
const fetchFlixster = async (url: string, revalidate = 3600) => {
  const res = await fetch(url, { headers, next: { revalidate } })
  if (!res.ok) {
    throw new Error(`Flixster request failed (${res.status})`)
  }
  return res.json()
}

export const fetchPopular = async () => {
  const data = await fetchFlixster(FLIXSTER_API_POPULAR_URL)
  return {
    opening: data?.data?.opening ?? [],
    popularity: data?.data?.popularity ?? [],
  }
}

export const fetchUpcoming = async () => {
  const data = await fetchFlixster(FLIXSTER_API_UPCOMING_URL)
  return data?.data?.upcoming ?? []
}

export const fetchSearch = async (query: string) => {
  const data = await fetchFlixster(
    `${FLIXSTER_API_SEARCH_URL}${encodeURIComponent(query)}`,
    300
  )
  return data?.data?.search?.movies ?? []
}

export const fetchDetails = async (id: string) => {
  const data = await fetchFlixster(
    `${FLIXSTER_API_MOVIE_DETAILS_URL}${encodeURIComponent(id)}`
  )
  return data?.data?.movie ?? null
}
