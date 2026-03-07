export const getSearchMovies = async (query: string) => {
  const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`)
  const data = await res.json()
  return data
}
