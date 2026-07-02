import type { IMovieDetail } from "@/components/MovieDetails/types"
import type { MovieType } from "@/types/MovieSchema"

export const createMovieObj = (movie: IMovieDetail, id: string, genres: string[], userRating:number | null = null) => {
   const movieData: MovieType = {
      movieId: id,
      name: movie.name,
      synopsis: movie.synopsis ?? null,
      consensus: movie.tomatoRating?.consensus || null,
      // Defensive fallbacks: quickAdd builds this object server-side from a raw
      // API payload, where any of these fields can be absent
      durationMinutes: movie.durationMinutes ?? 0,
      releaseDate: movie.releaseDate ?? '',
      directedBy: movie.directedBy ?? '',
      genres: genres,
      emsVersionId: movie.emsVersionId || id,
      posterImage: movie.posterImage?.url ?? '',
      tomatoMeter: movie.tomatoRating?.tomatometer || null,
      totalGross: movie.totalGross ?? null,
      motionPictureRating: movie.motionPictureRating?.code || 'Not Rated',
      userRating: userRating,
    }
    return movieData
}
