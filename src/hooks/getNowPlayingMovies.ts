import { TMDB_BASE_API_URL, TMDB_API_KEY } from "@/data/Contstants"

export const getNowPlayingMovies = async () => { 
  const res = await fetch(`${TMDB_BASE_API_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=en-US&page=1`)
  const data = await res.json()
  return data
}