import { FLIXSTER_API_MOVIE_DETAILS_URL, RAPID_API_HOST } from "@/data/Contstants"

const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': process.env.RAPID_API_KEY as string,
    'X-RapidAPI-Host': RAPID_API_HOST
	}
};

export const getMovieDetails = async (id: string) => { 
  const res = await fetch(`${FLIXSTER_API_MOVIE_DETAILS_URL}${id}`, options)
  const data = await res.json()
  return data
}