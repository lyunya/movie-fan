import { RAPID_API_HOST, RAPID_API_KEY, FLIXSTER_API_POPULAR_URL } from "@/data/Contstants"

const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': RAPID_API_KEY,
    'X-RapidAPI-Host': RAPID_API_HOST
	}
};

export const getPopularMovies = async () => { 
  const res = await fetch(FLIXSTER_API_POPULAR_URL, options)
  const data = await res.json()
  return data
}