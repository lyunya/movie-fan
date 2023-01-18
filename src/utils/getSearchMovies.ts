import { RAPID_API_HOST, FLIXSTER_API_SEARCH_URL } from "@/data/Contstants"

const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': 'd8739849e9msh9de0a072a19f9edp1762cejsne12be3c09936',
    'X-RapidAPI-Host': RAPID_API_HOST,
  },
}

export const getSearchMovies = async (query: string) => { 
  const res = await fetch(`${FLIXSTER_API_SEARCH_URL}${query}`, options)
  const data = await res.json()
  return data
}