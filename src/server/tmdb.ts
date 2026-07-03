/**
 * Server-only TMDB fetchers — the single movie + person data source for the
 * app. TMDB has no meaningful rate limit for an app this size, so cache
 * windows here are chosen for freshness rather than to protect a quota.
 *
 * Supports both TMDB credential styles: a v3 api key (query param) and a
 * v4 read access token (Bearer header — those are JWTs starting "eyJ").
 */
import { cache } from 'react'
import { env } from '../env/server.mjs'
import {
  TMDB_BASE_API_URL,
  TMDB_POSTER_URL,
  TMDB_BACKDROP_URL,
  TMDB_PROFILE_URL,
  TMDB_BACKDROP_THUMB_URL,
} from '@/data/Constants'
import type { Credit } from '@/components/CastGrid/types'
import type { IMovieDetail } from '@/components/MovieDetails/types'

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342'
const PROFILE_BASE = 'https://image.tmdb.org/t/p/w500'

// Cache lifetimes in seconds
export const REVALIDATE = {
  popular: 21_600, // 6h
  nowPlaying: 21_600, // 6h
  upcoming: 43_200, // 12h
  details: 86_400, // 24h
  search: 3_600, // 1h
} as const

export const isTmdbConfigured = () => !!env.TMDB_API_KEY

const tmdbFetch = async (
  path: string,
  params: Record<string, string> = {},
  revalidate: number = REVALIDATE.details
) => {
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
    next: { revalidate },
  })
  if (!res.ok) throw new Error(`TMDB request failed (${res.status}): ${path}`)
  return res.json()
}

/* -------------------------------------------------------------------- */
/* People                                                                */
/* -------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------- */
/* Movies                                                                */
/* -------------------------------------------------------------------- */

export interface MovieCardData {
  emsVersionId: string
  name: string
  posterImage: { url: string }
  releaseDate: string | null
  tomatoMeter: number | null
}

interface TmdbMovieSummary {
  id: number
  title: string
  poster_path?: string | null
  release_date?: string
  vote_average?: number | null
}

const scoreFromVoteAverage = (voteAverage?: number | null) =>
  voteAverage != null ? Math.round(voteAverage * 10) : null

const mapSummary = (m: TmdbMovieSummary): MovieCardData => ({
  emsVersionId: String(m.id),
  name: m.title,
  posterImage: {
    url: m.poster_path ? `${TMDB_POSTER_URL}${m.poster_path}` : '',
  },
  releaseDate: m.release_date || null,
  tomatoMeter: scoreFromVoteAverage(m.vote_average),
})

export const fetchPopular = async (): Promise<MovieCardData[]> => {
  const data = await tmdbFetch(
    '/movie/popular',
    { language: 'en-US', page: '1' },
    REVALIDATE.popular
  )
  return (data?.results ?? []).map(mapSummary)
}

export const fetchNowPlaying = async (): Promise<MovieCardData[]> => {
  const data = await tmdbFetch(
    '/movie/now_playing',
    { language: 'en-US', page: '1', region: 'US' },
    REVALIDATE.nowPlaying
  )
  return (data?.results ?? []).map(mapSummary)
}

export const fetchUpcoming = async (): Promise<MovieCardData[]> => {
  const data = await tmdbFetch(
    '/movie/upcoming',
    { language: 'en-US', page: '1', region: 'US' },
    REVALIDATE.upcoming
  )
  return (data?.results ?? []).map(mapSummary)
}

export const fetchSearch = async (query: string): Promise<MovieCardData[]> => {
  const data = await tmdbFetch(
    '/search/movie',
    { query, language: 'en-US', page: '1', include_adult: 'false' },
    REVALIDATE.search
  )
  return (data?.results ?? [])
    .filter((m: TmdbMovieSummary) => m?.id && m?.title)
    .map(mapSummary)
}

interface TmdbCastMember {
  id: number
  name: string
  character?: string
  profile_path?: string | null
}

interface TmdbCrewMember {
  id: number
  name: string
  job?: string
  department?: string
  profile_path?: string | null
}

// TMDB crew lists can run into the hundreds; Flixster's were short and
// curated, so an uncapped render here would be a real regression
const MAX_CREW = 12
const CREW_DEPARTMENT_PRIORITY = ['Directing', 'Writing', 'Production', 'Camera']

const mapCredit = (
  person: TmdbCastMember | TmdbCrewMember,
  extra: { characterName?: string; role?: string }
): Credit => ({
  id: String(person.id),
  name: person.name,
  ...extra,
  headShotImage: person.profile_path
    ? { url: `${TMDB_PROFILE_URL}${person.profile_path}` }
    : undefined,
})

export const fetchMovieDetails = cache(
  async (id: string): Promise<IMovieDetail | null> => {
    let data
    try {
      data = await tmdbFetch(
        `/movie/${encodeURIComponent(id)}`,
        {
          language: 'en-US',
          append_to_response: 'credits,videos,images,release_dates,watch/providers',
        },
        REVALIDATE.details
      )
    } catch {
      return null
    }
    if (!data?.id) return null

    const cast: Credit[] = (data.credits?.cast ?? []).map(
      (c: TmdbCastMember) => mapCredit(c, { characterName: c.character || undefined })
    )

    const crew: Credit[] = (data.credits?.crew ?? [])
      .slice()
      .sort((a: TmdbCrewMember, b: TmdbCrewMember) => {
        const rank = (dept?: string) => {
          const idx = CREW_DEPARTMENT_PRIORITY.indexOf(dept || '')
          return idx === -1 ? CREW_DEPARTMENT_PRIORITY.length : idx
        }
        return rank(a.department) - rank(b.department)
      })
      .slice(0, MAX_CREW)
      .map((c: TmdbCrewMember) => mapCredit(c, { role: c.job || undefined }))

    const directedBy = (data.credits?.crew ?? [])
      .filter((c: TmdbCrewMember) => c.job === 'Director')
      .map((c: TmdbCrewMember) => c.name)
      .join(', ')

    const usRelease = (data.release_dates?.results ?? []).find(
      (r: { iso_3166_1: string }) => r.iso_3166_1 === 'US'
    )
    const certification: string | null =
      (usRelease?.release_dates ?? []).find(
        (r: { certification?: string }) => r.certification
      )?.certification || null

    const trailerVideo = (data.videos?.results ?? [])
      .filter(
        (v: { type?: string; site?: string }) =>
          v.type === 'Trailer' && v.site === 'YouTube'
      )
      .sort(
        (a: { official?: boolean }, b: { official?: boolean }) =>
          Number(b.official) - Number(a.official)
      )[0]

    const images = (data.images?.backdrops ?? [])
      .slice(0, 12)
      .map((b: { file_path: string }) => ({
        url: `${TMDB_BACKDROP_THUMB_URL}${b.file_path}`,
      }))

    const usProviders = data['watch/providers']?.results?.US
    const mapProviders = (
      list?: { provider_name: string; logo_path: string }[]
    ) =>
      (list ?? []).map((p) => ({
        name: p.provider_name,
        logoUrl: `${TMDB_PROFILE_URL}${p.logo_path}`,
      }))
    const watchProviders = usProviders
      ? {
          flatrate: mapProviders(usProviders.flatrate),
          rent: mapProviders(usProviders.rent),
          buy: mapProviders(usProviders.buy),
          link: usProviders.link ?? null,
        }
      : null

    return {
      emsVersionId: String(data.id),
      id: String(data.id),
      name: data.title,
      synopsis: data.overview || null,
      genres: (data.genres ?? []).map((g: { name: string }) => ({ name: g.name })),
      posterImage: {
        url: data.poster_path ? `${TMDB_POSTER_URL}${data.poster_path}` : null,
      },
      backgroundImage: {
        url: data.backdrop_path
          ? `${TMDB_BACKDROP_URL}${data.backdrop_path}`
          : null,
      },
      releaseDate: data.release_date || null,
      durationMinutes: data.runtime ?? 0,
      directedBy,
      totalGross:
        data.revenue > 0
          ? new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0,
            }).format(data.revenue)
          : null,
      motionPictureRating: { code: certification },
      tomatoMeter: scoreFromVoteAverage(data.vote_average),
      voteCount: data.vote_count ?? null,
      consensus: data.tagline || null,
      trailer: {
        url: trailerVideo?.key
          ? `https://www.youtube.com/embed/${trailerVideo.key}`
          : null,
      },
      images,
      cast,
      crew,
      watchProviders,
    }
  }
)
