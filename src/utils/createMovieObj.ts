import type { FilmDetail } from '@/server/catalog/types'
import type { MovieType } from '@/types/MovieSchema'
import { filmImage, formatGross } from './film'

/** The snapshot of a Film stored on a Library entry. */
export const createMovieObj = (
  film: FilmDetail,
  userRating: number | null = null
): MovieType => ({
  movieId: film.id,
  emsVersionId: film.id,
  name: film.title,
  synopsis: film.overview,
  consensus: film.tagline,
  durationMinutes: film.runtime ?? 0,
  releaseDate: film.releaseDate ?? '',
  directedBy: film.directors.map((d) => d.name).join(', '),
  genres: film.genres.map((g) => g.name),
  // Existing rows and readers expect a full URL; paths arrive with the
  // server-built snapshots.
  posterImage: filmImage(film.posterPath, 'w500') ?? '',
  tomatoMeter:
    film.tmdb.average != null ? Math.round(film.tmdb.average * 10) : null,
  totalGross: formatGross(film.revenue),
  motionPictureRating: film.certification || 'Not Rated',
  userRating,
})
