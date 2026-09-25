/**
 * Client-safe helpers for rendering a Film. The Catalog hands out TMDB image
 * paths and raw scores; these turn them into what a screen shows.
 */
import type { Film } from '@/server/catalog/types'
import { describeScore, type ScoreDisplay } from './score'
import { tmdbImage, type TmdbImageSize } from './tmdbImage'

const TMDB_IMAGES = 'https://image.tmdb.org/t/p/'

/**
 * A sized TMDB image URL from a path ("/abc.jpg") or from a full TMDB URL
 * stored on an older Library snapshot. Returns null when there's no image,
 * so callers pick their own placeholder.
 */
export function filmImage(
  pathOrUrl: string | null | undefined,
  size: TmdbImageSize
): string | null {
  if (!pathOrUrl) return null
  if (pathOrUrl.startsWith('/')) return `${TMDB_IMAGES}${size}${pathOrUrl}`
  return tmdbImage(pathOrUrl, size)
}

export const POSTER_PLACEHOLDER = '/placeholderposter.svg'
export const PERSON_PLACEHOLDER = '/avatar.svg'

export const filmYear = (film: Pick<Film, 'releaseDate'>) =>
  film.releaseDate?.slice(0, 4) || null

/** TMDB average on the 0–100 scale, or null when nobody has rated it. */
export const tmdbPercent = (film: Pick<Film, 'tmdb'>) =>
  film.tmdb.average != null ? Math.round(film.tmdb.average * 10) : null

/** What score (or "No reviews yet") a film shows. */
export const filmScore = (
  film: Pick<Film, 'tmdb' | 'imdb' | 'releaseDate'>,
  now?: Date
): ScoreDisplay =>
  describeScore({
    tmdbScore: tmdbPercent(film),
    tmdbVotes: film.tmdb.votes,
    imdbRating: film.imdb?.rating,
    imdbVotes: film.imdb?.votes,
    releaseDate: film.releaseDate,
    now,
  })

export const trailerEmbedUrl = (key: string) =>
  `https://www.youtube-nocookie.com/embed/${key}`

/**
 * A Film from the snapshot stored on a Library entry or List item. Snapshots
 * keep a 0–100 TMDB score without a vote count, and genre names instead of
 * ids, so those fields are filled conservatively.
 */
export function filmFromSnapshot(snapshot: {
  movieId: string
  name: string
  posterImage: string | null
  releaseDate: string | null
  tomatoMeter: number | null
}): Film {
  return {
    id: snapshot.movieId,
    title: snapshot.name,
    releaseDate: snapshot.releaseDate || null,
    posterPath: snapshot.posterImage || null,
    backdropPath: null,
    genreIds: [],
    tmdb: {
      average: snapshot.tomatoMeter ? snapshot.tomatoMeter / 10 : null,
      votes: null,
    },
  }
}

/** Box office as "$123,456,789", or null when TMDB has no figure. */
export const formatGross = (revenue: number | null | undefined) =>
  revenue && revenue > 0
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(revenue)
    : null

/** A Film from a full Library entry. */
export const filmFromEntry = (entry: {
  filmId: string
  title: string
  posterPath: string | null
  releaseDate: string | null
  tmdbPercent: number | null
}): Film => ({
  id: entry.filmId,
  title: entry.title,
  releaseDate: entry.releaseDate,
  posterPath: entry.posterPath,
  backdropPath: null,
  genreIds: [],
  tmdb: {
    average: entry.tmdbPercent ? entry.tmdbPercent / 10 : null,
    votes: null,
  },
})
