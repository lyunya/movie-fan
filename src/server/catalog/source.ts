/**
 * The Catalog's seam. A CatalogSource answers raw TMDB-shaped requests and
 * IMDb rating lookups; everything else (mapping, filters, image paths, score
 * rules) lives in createCatalog and is shared by every source.
 *
 * Two adapters sit here: `tmdbHttpSource` for production and
 * `fixtureSource` (./fixtures) for tests and offline local development.
 */
import type { ImdbScore } from './types'

export interface CatalogSource {
  /** GET a TMDB v3 path. Rejects with CatalogNotFound on 404. */
  tmdb<T = unknown>(
    path: string,
    params: Record<string, string>,
    revalidateSeconds: number
  ): Promise<T>
  /** IMDb rating for an IMDb id, or null when unknown or unavailable. */
  imdb(imdbId: string): Promise<ImdbScore | null>
}

export class CatalogNotFound extends Error {
  constructor(path: string) {
    super(`Not found in the film database: ${path}`)
  }
}

export class CatalogUnavailable extends Error {
  constructor(
    public status: number,
    path: string
  ) {
    super(`Film database request failed (${status}): ${path}`)
  }
}

const TMDB_API = 'https://api.themoviedb.org/3'

/**
 * Production adapter. Supports both TMDB credential styles: a v3 api key
 * (query param) and a v4 read access token (Bearer JWT starting "eyJ").
 * Next's data cache honours `revalidateSeconds` per request.
 */
export function tmdbHttpSource({
  apiKey,
  imdb,
}: {
  apiKey: string | undefined
  imdb: (imdbId: string) => Promise<ImdbScore | null>
}): CatalogSource {
  return {
    async tmdb<T>(
      path: string,
      params: Record<string, string>,
      revalidateSeconds: number
    ): Promise<T> {
      if (!apiKey) throw new Error('TMDB_API_KEY is not configured')
      const bearer = apiKey.startsWith('eyJ')
      const url = new URL(`${TMDB_API}${path}`)
      for (const [name, value] of Object.entries(params))
        url.searchParams.set(name, value)
      if (!bearer) url.searchParams.set('api_key', apiKey)
      const res = await fetch(url, {
        headers: bearer ? { Authorization: `Bearer ${apiKey}` } : undefined,
        next: { revalidate: revalidateSeconds },
        signal: AbortSignal.timeout(15000),
      })
      if (res.status === 404) throw new CatalogNotFound(path)
      if (!res.ok) throw new CatalogUnavailable(res.status, path)
      return (await res.json()) as T
    },
    imdb,
  }
}
