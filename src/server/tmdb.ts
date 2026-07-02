/**
 * Server-only TMDB fetchers powering the in-app people pages. TMDB is used
 * solely for person data (the Flixster API has no people endpoint); movie
 * detail pages stay on Flixster ids via the /api/find-movie resolver.
 *
 * Supports both TMDB credential styles: a v3 api key (query param) and a
 * v4 read access token (Bearer header — those are JWTs starting "eyJ").
 */
import { env } from '../env/server.mjs'
import { TMDB_BASE_API_URL } from '@/data/Constants'

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342'
const PROFILE_BASE = 'https://image.tmdb.org/t/p/w500'

export interface PersonCredit {
  tmdbId: number
  title: string
  year: string | null
  character: string | null
  posterUrl: string | null
  popularity: number
}

export interface Person {
  id: number
  name: string
  biography: string | null
  birthday: string | null
  deathday: string | null
  placeOfBirth: string | null
  knownForDepartment: string | null
  profileUrl: string | null
  credits: PersonCredit[]
}

export const isTmdbConfigured = () => !!env.TMDB_API_KEY

const tmdbFetch = async (path: string, params: Record<string, string> = {}) => {
  const key = env.TMDB_API_KEY
  if (!key) throw new Error('TMDB_API_KEY is not configured')

  const isBearerToken = key.startsWith('eyJ')
  const url = new URL(`${TMDB_BASE_API_URL}${path}`)
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value)
  }
  if (!isBearerToken) url.searchParams.set('api_key', key)

  const res = await fetch(url, {
    headers: isBearerToken ? { Authorization: `Bearer ${key}` } : undefined,
    // People data barely changes; cache aggressively
    next: { revalidate: 86400 },
  })
  if (!res.ok) throw new Error(`TMDB request failed (${res.status}): ${path}`)
  return res.json()
}

/**
 * Look up a person by name and return their profile with acting credits,
 * most-popular first. Returns null when nobody matches.
 */
export const fetchPerson = async (name: string): Promise<Person | null> => {
  const search = await tmdbFetch('/search/person', {
    query: name,
    include_adult: 'false',
    language: 'en-US',
    page: '1',
  })
  const match = search?.results?.[0]
  if (!match?.id) return null

  const person = await tmdbFetch(`/person/${match.id}`, {
    append_to_response: 'movie_credits',
    language: 'en-US',
  })
  if (!person?.id) return null

  const seen = new Set<number>()
  const credits: PersonCredit[] = (person.movie_credits?.cast ?? [])
    .filter((credit: { id?: number; title?: string }) => {
      if (!credit.id || !credit.title || seen.has(credit.id)) return false
      seen.add(credit.id)
      return true
    })
    .map(
      (credit: {
        id: number
        title: string
        character?: string
        release_date?: string
        poster_path?: string
        popularity?: number
      }): PersonCredit => ({
        tmdbId: credit.id,
        title: credit.title,
        year: credit.release_date ? credit.release_date.slice(0, 4) : null,
        character: credit.character || null,
        posterUrl: credit.poster_path
          ? `${POSTER_BASE}${credit.poster_path}`
          : null,
        popularity: credit.popularity ?? 0,
      })
    )
    .sort(
      (a: PersonCredit, b: PersonCredit) => b.popularity - a.popularity
    )

  return {
    id: person.id,
    name: person.name,
    biography: person.biography || null,
    birthday: person.birthday || null,
    deathday: person.deathday || null,
    placeOfBirth: person.place_of_birth || null,
    knownForDepartment: person.known_for_department || null,
    profileUrl: person.profile_path
      ? `${PROFILE_BASE}${person.profile_path}`
      : null,
    credits,
  }
}
