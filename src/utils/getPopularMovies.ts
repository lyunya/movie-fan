import { RAPID_API_HOST, FLIXSTER_API_POPULAR_URL } from "@/data/Contstants"

const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': process.env.RAPID_API_KEY as string,
    'X-RapidAPI-Host': RAPID_API_HOST
	}
};

export const getPopularMovies = async () => {
  const res = await fetch(FLIXSTER_API_POPULAR_URL, options)
  if (!res.ok) {
    throw new Error(`Popular movies request failed with status ${res.status}`)
  }
  const data = await res.json()
  return data
}