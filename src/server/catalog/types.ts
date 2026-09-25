/**
 * The Catalog's vocabulary: what a Film is, everywhere in the app.
 *
 * Type-only and dependency-free, so client components can import these with
 * `import type` without pulling server code into the bundle. Images are
 * carried as TMDB paths (e.g. "/abc.jpg"); size them at render time with
 * `filmImage()` from `@/utils/film`.
 */

/** TMDB's numeric movie id, as a string. Used as the key everywhere. */
export type FilmId = string

export interface TmdbScore {
  /** 0–10 average; null when nobody has rated the film */
  average: number | null
  votes: number | null
}

export interface ImdbScore {
  rating: number
  votes: number | null
}

export interface Film {
  id: FilmId
  title: string
  /** ISO date (YYYY-MM-DD) or null when unknown */
  releaseDate: string | null
  /** TMDB image path, or a full URL on older Library snapshots */
  posterPath: string | null
  backdropPath: string | null
  genreIds: number[]
  tmdb: TmdbScore
  /** Present only where IMDb enrichment was requested */
  imdb?: ImdbScore | null
}

export interface Genre {
  id: number
  name: string
}

export interface Credit {
  personId: number
  name: string
  /** Character played, for cast */
  character: string | null
  /** Job, for crew (e.g. "Director") */
  job: string | null
  profilePath: string | null
}

export interface Provider {
  id: number
  name: string
  logoPath: string | null
}

/** Where a film can be watched in one Region, by how you pay for it. */
export interface WhereToWatch {
  region: string
  /** JustWatch page for the film in this region */
  link: string | null
  subscription: Provider[]
  free: Provider[]
  ads: Provider[]
  rent: Provider[]
  buy: Provider[]
}

export interface FilmDetail extends Film {
  tagline: string | null
  overview: string | null
  /** Minutes; null when TMDB doesn't know */
  runtime: number | null
  genres: Genre[]
  /** US certification such as "PG-13" */
  certification: string | null
  directors: { personId: number; name: string }[]
  /** Box office in USD; null when unknown */
  revenue: number | null
  /** YouTube video key of the best trailer */
  trailerKey: string | null
  /** Backdrop stills (paths) */
  stills: string[]
  cast: Credit[]
  crew: Credit[]
  /** Availability in the requested Region (US by default) */
  whereToWatch: WhereToWatch | null
  similar: Film[]
}

export interface FilmPage {
  films: Film[]
  page: number
  totalPages: number
  totalResults: number
}

export interface PersonSummary {
  id: number
  name: string
  profilePath: string | null
  /** A couple of well-known titles, comma separated */
  knownFor: string | null
}

export interface SearchResults extends FilmPage {
  people: PersonSummary[]
}

export interface PersonCredit {
  filmId: FilmId
  title: string
  year: string | null
  character: string | null
  posterPath: string | null
  popularity: number
  role: 'Acting' | 'Directing'
}

export interface Person {
  id: number
  name: string
  biography: string | null
  birthday: string | null
  deathday: string | null
  placeOfBirth: string | null
  knownForDepartment: string | null
  profilePath: string | null
  credits: PersonCredit[]
}

export interface ProviderOption extends Provider {
  /** Lower sorts first */
  priority: number
}

export type FilmListName =
  | 'popular'
  | 'nowPlaying'
  | 'upcoming'
  | 'topRated'
  | 'trendingWeek'
  | 'trendingDay'

export interface DiscoverFilters {
  /** Films in ANY of these genres */
  genreIds?: number[]
  maxRuntime?: number
  /** First year of a decade, e.g. 1990 */
  decade?: number
  /** Minimum TMDB score on the 0–100 scale */
  minScore?: number
  minVotes?: number
  /** Only films already released by this ISO date */
  releasedBy?: string
  /** Region for release dates and streaming (default US) */
  region?: string
  /** Only films streaming by subscription in `region`; empty ids = any service */
  streamingOn?: number[]
  page?: number
}
