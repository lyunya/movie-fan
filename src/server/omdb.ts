import { env } from '@/env/server.mjs'
import {
  parseImdbRating,
  type ImdbRating,
  type OmdbRatingResponse,
} from '@/utils/imdbRating'

const OMDB_API_URL = 'https://www.omdbapi.com/'
const OMDB_REVALIDATE_SECONDS = 60 * 60 * 24 * 7
const IMDB_ID_PATTERN = /^tt\d+$/

/**
 * Fetches one IMDb rating through OMDb. All failures intentionally become a
 * null result so a third-party outage or exhausted quota never breaks a page.
 */
export const fetchImdbRating = async (
  imdbId?: string | null
): Promise<ImdbRating | null> => {
  const key = env.OMDB_API_KEY
  if (!key || !imdbId || !IMDB_ID_PATTERN.test(imdbId)) return null

  const url = new URL(OMDB_API_URL)
  url.searchParams.set('apikey', key)
  url.searchParams.set('i', imdbId)

  try {
    const response = await fetch(url, {
      next: { revalidate: OMDB_REVALIDATE_SECONDS },
    })
    if (!response.ok) return null
    return parseImdbRating((await response.json()) as OmdbRatingResponse)
  } catch {
    return null
  }
}
