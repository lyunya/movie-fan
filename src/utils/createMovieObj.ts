import type { IMovieDetail } from "@/components/MovieDetails/types"
import type { MovieType } from "@/types/MovieSchema"

export const createMovieObj = (movie: IMovieDetail, id: string, genres: string[], userRating:number | null = null) => { 
   const movieData: MovieType = {
      movieId: id,
      name: movie.name,
      synopsis: movie.synopsis,
      consensus: movie.tomatoRating?.consensus || null,
      durationMinutes: movie.durationMinutes,
      releaseDate: movie.releaseDate,
      directedBy: movie.directedBy,
      genres: genres,
      emsVersionId: movie.emsVersionId || id,
      posterImage: movie.posterImage.url,
      tomatoMeter: movie.tomatoRating?.tomatometer || null,
      totalGross: movie.totalGross,
      motionPictureRating: movie.motionPictureRating?.code || 'Not Rated',
      userRating: userRating,
    }
    return movieData
}