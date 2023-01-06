import { TMDB_MOVIE_DETAILS_URL, TMDB_API_KEY } from "@/data/Contstants"

export const getMovieDetails = async (id: string | undefined) => { 
  const res = await fetch(`${TMDB_MOVIE_DETAILS_URL}${id}?api_key=${TMDB_API_KEY}&language=en-US`)
  const data = await res.json()
  return data
}