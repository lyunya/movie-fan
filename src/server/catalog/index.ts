/**
 * The app's Catalog: one instance, wired to TMDB over HTTP, or to offline
 * fixtures when TMDB_FIXTURES=1. Import `catalog` from here on the server;
 * import types from './types' anywhere.
 *
 * Per-request memoization (React `cache`) dedupes the same lookups made by
 * a page and its metadata in one render.
 */
import { cache } from 'react'
import { env } from '@/env/server.mjs'
import { fetchImdbRating } from '../omdb'
import { createCatalog } from './createCatalog'
import { fixtureSource } from './fixtures'
import { tmdbHttpSource } from './source'

export const usingFixtures = process.env.TMDB_FIXTURES === '1'

const base = createCatalog(
  usingFixtures
    ? fixtureSource()
    : tmdbHttpSource({
        apiKey: env.TMDB_API_KEY,
        imdb: async (imdbId) => {
          const r = await fetchImdbRating(imdbId)
          return r ? { rating: r.rating, votes: r.voteCount ?? null } : null
        },
      })
)

export const catalog = {
  ...base,
  filmDetail: cache(base.filmDetail),
  person: cache(base.person),
  genres: cache(base.genres),
}

/** True when a real TMDB key is configured, or fixtures are in use. */
export const isCatalogConfigured = () => usingFixtures || !!env.TMDB_API_KEY

export { REVALIDATE } from './createCatalog'
export type * from './types'
