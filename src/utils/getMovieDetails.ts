import { FLIXSTER_API_MOVIE_DETAILS_URL, RAPID_API_HOST } from "@/data/Contstants"

const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': "d8739849e9msh9de0a072a19f9edp1762cejsne12be3c09936",
    'X-RapidAPI-Host': RAPID_API_HOST
	}
};

export const getMovieDetails = async (id: string) => { 
  const res = await fetch(`${FLIXSTER_API_MOVIE_DETAILS_URL}${id}`, options)
  const data = await res.json()
  return data
}