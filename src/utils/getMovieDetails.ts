export const getMovieDetails = async (id: string) => {
  const res = await fetch(`/api/movie/${id}`)
  const data = await res.json()
  return data
}
