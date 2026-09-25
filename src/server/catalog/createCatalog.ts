/**
 * The Catalog module: everything the app knows about Films, People, genres,
 * and where to watch, behind one small interface. Callers never see TMDB's
 * response shapes; they get `Film`, `FilmDetail`, and friends.
 *
 * `createCatalog(source)` takes the seam (./source) so tests and offline
 * development can swap the network for fixtures without touching callers.
 */
import type { CatalogSource } from './source'
import { CatalogNotFound } from './source'
import type {
  Credit,
  DiscoverFilters,
  Film,
  FilmDetail,
  FilmListName,
  FilmPage,
  Genre,
  Person,
  PersonCredit,
  PersonSummary,
  Provider,
  ProviderOption,
  SearchResults,
  WhereToWatch,
} from './types'

/** Cache lifetimes in seconds, chosen for freshness, not quota. */
export const REVALIDATE = {
  lists: 21_600, // 6h
  slowLists: 43_200, // 12h
  details: 86_400, // 24h
  search: 3_600, // 1h
  availability: 3_600, // 1h
  externalIds: 604_800, // 7d
} as const

/* ---------------------------------------------------------------- */
/* TMDB response shapes (private to this module)                    */
/* ---------------------------------------------------------------- */

interface TmdbFilm {
  id: number
  title?: string
  poster_path?: string | null
  backdrop_path?: string | null
  release_date?: string
  vote_count?: number | null
  vote_average?: number | null
  genre_ids?: number[]
  popularity?: number
}
interface TmdbPage<T> {
  results?: T[]
  page?: number
  total_pages?: number
  total_results?: number
}
interface TmdbPerson {
  id: number
  name: string
  biography?: string
  birthday?: string
  deathday?: string
  place_of_birth?: string
  known_for_department?: string
  profile_path?: string | null
  movie_credits?: { cast?: TmdbPersonCredit[]; crew?: TmdbPersonCredit[] }
}
interface TmdbPersonCredit {
  id?: number
  title?: string
  character?: string
  release_date?: string
  poster_path?: string | null
  popularity?: number
  job?: string
}
interface TmdbMultiResult extends TmdbFilm {
  media_type?: string
  name?: string
  profile_path?: string | null
  known_for?: { title?: string; name?: string }[]
}
interface TmdbProvider {
  provider_id: number
  provider_name: string
  logo_path?: string | null
  display_priority?: number
}
interface TmdbRegionProviders {
  link?: string
  flatrate?: TmdbProvider[]
  free?: TmdbProvider[]
  ads?: TmdbProvider[]
  rent?: TmdbProvider[]
  buy?: TmdbProvider[]
}
interface TmdbCredit {
  id: number
  name: string
  character?: string
  job?: string
  department?: string
  profile_path?: string | null
}
interface TmdbFilmDetail extends TmdbFilm {
  imdb_id?: string | null
  overview?: string
  tagline?: string
  runtime?: number | null
  revenue?: number
  genres?: Genre[]
  credits?: { cast?: TmdbCredit[]; crew?: TmdbCredit[] }
  videos?: {
    results?: {
      type?: string
      site?: string
      key?: string
      official?: boolean
    }[]
  }
  images?: { backdrops?: { file_path: string }[] }
  release_dates?: {
    results?: {
      iso_3166_1: string
      release_dates?: { certification?: string }[]
    }[]
  }
  'watch/providers'?: { results?: Record<string, TmdbRegionProviders> }
  recommendations?: TmdbPage<TmdbFilm>
}

/* ---------------------------------------------------------------- */
/* Mapping                                                           */
/* ---------------------------------------------------------------- */

const toFilm = (m: TmdbFilm): Film => ({
  id: String(m.id),
  title: m.title ?? '',
  releaseDate: m.release_date || null,
  posterPath: m.poster_path || null,
  backdropPath: m.backdrop_path || null,
  genreIds: m.genre_ids ?? [],
  // TMDB reports 0 for "nobody has voted"; that is an absence, not a verdict
  tmdb: {
    average: m.vote_count && m.vote_average ? m.vote_average : null,
    votes: m.vote_count ?? null,
  },
})

/** Lists only show films we can draw: an id, a title, and a poster. */
const presentable = (m: TmdbFilm | undefined | null): m is TmdbFilm =>
  !!m?.id && !!m.title && !!m.poster_path

const toFilms = (results: TmdbFilm[] | undefined) =>
  (results ?? []).filter(presentable).map(toFilm)

const toProvider = (p: TmdbProvider): Provider => ({
  id: p.provider_id,
  name: p.provider_name,
  logoPath: p.logo_path || null,
})

const toWhereToWatch = (
  region: string,
  entry: TmdbRegionProviders | undefined
): WhereToWatch | null =>
  entry
    ? {
        region,
        link: entry.link || null,
        subscription: (entry.flatrate ?? []).map(toProvider),
        free: (entry.free ?? []).map(toProvider),
        ads: (entry.ads ?? []).map(toProvider),
        rent: (entry.rent ?? []).map(toProvider),
        buy: (entry.buy ?? []).map(toProvider),
      }
    : null

const toCredit = (c: TmdbCredit): Credit => ({
  personId: c.id,
  name: c.name,
  character: c.character || null,
  job: c.job || null,
  profilePath: c.profile_path || null,
})

// TMDB crew lists run into the hundreds; show the people that matter first
const MAX_CREW = 12
const CREW_PRIORITY = ['Directing', 'Writing', 'Production', 'Camera']
const crewRank = (department?: string) => {
  const i = CREW_PRIORITY.indexOf(department || '')
  return i === -1 ? CREW_PRIORITY.length : i
}

const toPerson = (p: TmdbPerson): Person => {
  const seen = new Set<string>()
  const credits: PersonCredit[] = [
    ...(p.movie_credits?.cast ?? []),
    ...(p.movie_credits?.crew ?? []).filter((c) => c.job === 'Director'),
  ]
    .filter((c): c is TmdbPersonCredit & { id: number; title: string } => {
      const key = `${c.id}-${c.job || 'Acting'}`
      if (!c.id || !c.title || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((c) => ({
      filmId: String(c.id),
      title: c.title,
      year: c.release_date ? c.release_date.slice(0, 4) : null,
      character: c.character || null,
      posterPath: c.poster_path || null,
      popularity: c.popularity ?? 0,
      role: c.job === 'Director' ? ('Directing' as const) : ('Acting' as const),
    }))
    .sort((a, b) => b.popularity - a.popularity)
  return {
    id: p.id,
    name: p.name,
    biography: p.biography || null,
    birthday: p.birthday || null,
    deathday: p.deathday || null,
    placeOfBirth: p.place_of_birth || null,
    knownForDepartment: p.known_for_department || null,
    profilePath: p.profile_path || null,
    credits,
  }
}

const toPersonSummary = (p: TmdbMultiResult): PersonSummary => ({
  id: p.id,
  name: p.name ?? '',
  profilePath: p.profile_path || null,
  knownFor:
    (p.known_for ?? [])
      .map((k) => k.title || k.name)
      .filter(Boolean)
      .slice(0, 2)
      .join(', ') || null,
})

const toPage = (data: TmdbPage<TmdbFilm>, page: number): FilmPage => {
  const films = toFilms(data.results)
  return {
    films,
    page: data.page ?? page,
    // TMDB caps paging at 500
    totalPages: Math.min(data.total_pages ?? 1, 500),
    totalResults: data.total_results ?? films.length,
  }
}

// Well-known services first in pickers, then TMDB's own display order
const FEATURED_PROVIDERS = [
  'Netflix',
  'Amazon Prime Video',
  'Disney Plus',
  'Hulu',
  'HBO Max',
  'Apple TV',
  'Paramount Plus Premium',
  'Peacock Premium',
  'Crunchyroll',
  'MUBI',
  'The Roku Channel',
  'Tubi TV',
  'Criterion Channel',
  'Shudder',
  'Starz',
  'BritBox',
  'Kanopy',
  'Hoopla',
]

const LIST_PATHS: Record<
  FilmListName,
  { path: string; regional: boolean; revalidate: number }
> = {
  popular: {
    path: '/movie/popular',
    regional: false,
    revalidate: REVALIDATE.lists,
  },
  nowPlaying: {
    path: '/movie/now_playing',
    regional: true,
    revalidate: REVALIDATE.lists,
  },
  upcoming: {
    path: '/movie/upcoming',
    regional: true,
    revalidate: REVALIDATE.slowLists,
  },
  topRated: {
    path: '/movie/top_rated',
    regional: true,
    revalidate: REVALIDATE.slowLists,
  },
  trendingWeek: {
    path: '/trending/movie/week',
    regional: false,
    revalidate: REVALIDATE.lists,
  },
  trendingDay: {
    path: '/trending/movie/day',
    regional: false,
    revalidate: REVALIDATE.lists,
  },
}

/** Build TMDB /discover parameters from our filters. One place, one set of rules. */
export function discoverParams(
  filters: DiscoverFilters
): Record<string, string> {
  const region = filters.region || 'US'
  const params: Record<string, string> = {
    include_adult: 'false',
    include_video: 'false',
    language: 'en-US',
    region,
    sort_by: 'popularity.desc',
    page: String(filters.page ?? 1),
    'vote_count.gte': String(filters.minVotes ?? 50),
  }
  if (filters.genreIds?.length) params.with_genres = filters.genreIds.join('|')
  if (filters.maxRuntime) {
    params['with_runtime.lte'] = String(filters.maxRuntime)
    params['with_runtime.gte'] = '1'
  }
  if (filters.decade) {
    params['primary_release_date.gte'] = `${filters.decade}-01-01`
    params['primary_release_date.lte'] = `${filters.decade + 9}-12-31`
  }
  if (filters.releasedBy) {
    const lte = params['primary_release_date.lte']
    params['primary_release_date.lte'] =
      lte && lte < filters.releasedBy ? lte : filters.releasedBy
  }
  if (filters.minScore != null)
    params['vote_average.gte'] = String(filters.minScore / 10)
  if (filters.streamingOn) {
    params.watch_region = region
    // Free and ad-supported services count: anyone can watch those
    params.with_watch_monetization_types = 'flatrate|free|ads'
    if (filters.streamingOn.length)
      params.with_watch_providers = filters.streamingOn.join('|')
  }
  return params
}

/* ---------------------------------------------------------------- */
/* The interface                                                     */
/* ---------------------------------------------------------------- */

export function createCatalog(source: CatalogSource) {
  const get = <T>(path: string, params: Record<string, string>, ttl: number) =>
    source.tmdb<T>(path, params, ttl)

  /** Everything the movie page needs, in one request (+ IMDb). Null if unknown. */
  async function filmDetail(
    id: string,
    { region = 'US' }: { region?: string } = {}
  ): Promise<FilmDetail | null> {
    if (!/^\d+$/.test(id)) return null
    let data: TmdbFilmDetail
    try {
      data = await get<TmdbFilmDetail>(
        `/movie/${id}`,
        {
          language: 'en-US',
          append_to_response:
            'credits,videos,images,release_dates,watch/providers,recommendations',
        },
        REVALIDATE.details
      )
    } catch (error) {
      if (error instanceof CatalogNotFound) return null
      throw error
    }
    if (!data?.id) return null
    const imdb = data.imdb_id ? await source.imdb(data.imdb_id) : null
    const crew = data.credits?.crew ?? []
    const trailer = (data.videos?.results ?? [])
      .filter((v) => v.type === 'Trailer' && v.site === 'YouTube' && v.key)
      .sort((a, b) => Number(!!b.official) - Number(!!a.official))[0]
    const certification =
      data.release_dates?.results
        ?.find((r) => r.iso_3166_1 === 'US')
        ?.release_dates?.find((r) => r.certification)?.certification || null
    return {
      ...toFilm({ ...data, genre_ids: (data.genres ?? []).map((g) => g.id) }),
      imdb,
      tagline: data.tagline || null,
      overview: data.overview || null,
      runtime: data.runtime || null,
      genres: (data.genres ?? []).map((g) => ({ id: g.id, name: g.name })),
      certification,
      directors: crew
        .filter((c) => c.job === 'Director')
        .map((c) => ({ personId: c.id, name: c.name })),
      revenue: data.revenue && data.revenue > 0 ? data.revenue : null,
      trailerKey: trailer?.key ?? null,
      stills: (data.images?.backdrops ?? [])
        .slice(0, 12)
        .map((b) => b.file_path),
      cast: (data.credits?.cast ?? []).map(toCredit),
      crew: crew
        .slice()
        .sort((a, b) => crewRank(a.department) - crewRank(b.department))
        .slice(0, MAX_CREW)
        .map(toCredit),
      whereToWatch: toWhereToWatch(
        region,
        data['watch/providers']?.results?.[region]
      ),
      similar: toFilms(data.recommendations?.results).slice(0, 12),
    }
  }

  /** A curated TMDB list (popular, in theaters, …), first page. */
  async function films(
    name: FilmListName,
    { region = 'US' }: { region?: string } = {}
  ): Promise<Film[]> {
    const list = LIST_PATHS[name]
    const data = await get<TmdbPage<TmdbFilm>>(
      list.path,
      {
        language: 'en-US',
        page: '1',
        ...(list.regional ? { region } : {}),
      },
      list.revalidate
    )
    return toFilms(data?.results)
  }

  /** Popular films matching filters (genre, runtime, decade, streaming…). */
  async function discover(filters: DiscoverFilters = {}): Promise<FilmPage> {
    const data = await get<TmdbPage<TmdbFilm>>(
      '/discover/movie',
      discoverParams(filters),
      REVALIDATE.search
    )
    return toPage(data ?? {}, filters.page ?? 1)
  }

  /** Films and people matching a query. */
  async function search(query: string, page = 1): Promise<SearchResults> {
    const data = await get<TmdbPage<TmdbMultiResult>>(
      '/search/multi',
      {
        query,
        language: 'en-US',
        page: String(page),
        include_adult: 'false',
      },
      REVALIDATE.search
    )
    const results = data?.results ?? []
    const films = toFilms(results.filter((r) => r.media_type === 'movie'))
    return {
      films,
      people: results
        .filter((r) => r.media_type === 'person' && r.id && r.name)
        .slice(0, 12)
        .map(toPersonSummary),
      page: data?.page ?? page,
      totalPages: Math.min(data?.total_pages ?? 1, 500),
      totalResults: data?.total_results ?? films.length,
    }
  }

  /** A person with their acting and directing credits, most popular first. */
  async function person(id: number): Promise<Person | null> {
    const data = await get<TmdbPerson>(
      `/person/${id}`,
      { append_to_response: 'movie_credits', language: 'en-US' },
      REVALIDATE.details
    ).catch(() => null)
    return data?.id ? toPerson(data) : null
  }

  /** Legacy lookup for old name-based URLs: best search hit, then by id. */
  async function personByName(name: string): Promise<Person | null> {
    const data = await get<TmdbPage<{ id: number }>>(
      '/search/person',
      { query: name, include_adult: 'false', language: 'en-US', page: '1' },
      REVALIDATE.details
    ).catch(() => null)
    const match = data?.results?.[0]
    return match?.id ? person(match.id) : null
  }

  /** TMDB's movie genres. */
  async function genres(): Promise<Genre[]> {
    const data = await get<{ genres?: Genre[] }>(
      '/genre/movie/list',
      { language: 'en-US' },
      REVALIDATE.details
    )
    return (data?.genres ?? []).map((g) => ({ id: g.id, name: g.name }))
  }

  /** Streaming services offered in a Region, featured ones first. */
  async function providers(region = 'US'): Promise<ProviderOption[]> {
    const data = await get<{ results?: TmdbProvider[] }>(
      '/watch/providers/movie',
      { language: 'en-US', watch_region: region },
      REVALIDATE.details
    )
    return (data?.results ?? [])
      .filter((p) => p.provider_id && p.provider_name)
      .map((p) => ({ ...toProvider(p), priority: p.display_priority ?? 999 }))
      .sort((a, b) => {
        const fa = FEATURED_PROVIDERS.indexOf(a.name)
        const fb = FEATURED_PROVIDERS.indexOf(b.name)
        if (fa !== -1 || fb !== -1) {
          if (fa === -1) return 1
          if (fb === -1) return -1
          return fa - fb
        }
        return a.priority - b.priority || a.name.localeCompare(b.name)
      })
  }

  /** Where one film can be watched in a Region; null if TMDB lists nothing. */
  async function whereToWatch(
    id: string,
    region: string
  ): Promise<WhereToWatch | null> {
    const data = await get<{ results?: Record<string, TmdbRegionProviders> }>(
      `/movie/${id}/watch/providers`,
      {},
      REVALIDATE.availability
    )
    return toWhereToWatch(region, data?.results?.[region])
  }

  /** Attach IMDb ratings where known. Failures leave a film unchanged. */
  async function withImdb(list: Film[]): Promise<Film[]> {
    return Promise.all(
      list.map(async (film) => {
        try {
          const ids = await get<{ imdb_id?: string | null }>(
            `/movie/${film.id}/external_ids`,
            {},
            REVALIDATE.externalIds
          )
          const imdb = ids?.imdb_id ? await source.imdb(ids.imdb_id) : null
          return imdb ? { ...film, imdb } : film
        } catch {
          return film
        }
      })
    )
  }

  return {
    filmDetail,
    films,
    discover,
    search,
    person,
    personByName,
    genres,
    providers,
    whereToWatch,
    withImdb,
  }
}

export type Catalog = ReturnType<typeof createCatalog>
