import { FLIXSTER_API_MOVIE_DETAILS_URL, RAPID_API_HOST, RAPID_API_KEY } from "@/data/Contstants"

const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': RAPID_API_KEY,
    'X-RapidAPI-Host': RAPID_API_HOST
	}
};

export const getMovieDetails = async (id: string | undefined) => { 
  const res = await fetch(`${FLIXSTER_API_MOVIE_DETAILS_URL}${id}`, options)
  const data = await res.json()
  return data
}