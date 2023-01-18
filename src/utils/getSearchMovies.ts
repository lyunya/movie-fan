import { RAPID_API_HOST, FLIXSTER_API_SEARCH_URL } from "@/data/Contstants"

const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': process.env.RAPID_API_KEY as string,
    'X-RapidAPI-Host': RAPID_API_HOST
	}
};

export const getSearchMovies = async (query: string) => { 
  const res = await fetch(`${FLIXSTER_API_SEARCH_URL}${query}`, options)
  const data = await res.json()
  return data
}