/**
 * The copy of a Film's facts stored with a Library entry, Viewing, or List
 * item, so those pages draw without asking the Catalog again. Always built
 * on the server from the Catalog; clients only ever send a filmId.
 *
 * Images are stored as TMDB paths. Older rows hold full URLs; readers size
 * both with `filmImage()`.
 */
import type { FilmDetail } from '@/server/catalog/types'
import { formatGross, tmdbPercent } from '@/utils/film'

/** Columns of a Library entry that describe the Film. */
export const entrySnapshot = (film: FilmDetail) => ({
  movieId: film.id,
  emsVersionId: film.id,
  name: film.title,
  posterImage: film.posterPath,
  releaseDate: film.releaseDate,
  durationMinutes: film.runtime ?? 0,
  genres: film.genres.map((g) => g.name),
  directedBy: film.directors.map((d) => d.name).join(', '),
  synopsis: film.overview,
  consensus: film.tagline,
  tomatoMeter: tmdbPercent(film),
  totalGross: formatGross(film.revenue),
  motionPictureRating: film.certification || 'Not Rated',
})

export type EntrySnapshot = ReturnType<typeof entrySnapshot>

/** Columns of a Viewing that describe the Film, from an entry snapshot. */
export const viewingSnapshot = (s: {
  movieId: string
  name: string
  posterImage: string | null
  releaseDate: string | null
  durationMinutes: number
  genres: string[]
}) => ({
  movieId: s.movieId,
  name: s.name,
  posterImage: s.posterImage,
  releaseDate: s.releaseDate,
  durationMinutes: s.durationMinutes,
  genres: s.genres,
})

/** Columns of a List item that describe the Film. */
export const listItemSnapshot = (film: FilmDetail) => ({
  movieId: film.id,
  name: film.title,
  posterImage: film.posterPath,
  releaseDate: film.releaseDate,
  tomatoMeter: tmdbPercent(film),
})
