import { RAPID_API_HOST, FLIXSTER_API_UPCOMING_URL } from "@/data/Constants"

const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': process.env.RAPID_API_KEY as string,
    'X-RapidAPI-Host': RAPID_API_HOST
	}
};

export const getUpcomingMovies = async () => { 
  const res = await fetch(FLIXSTER_API_UPCOMING_URL, options)
  const data = await res.json()
  return data
}