export interface OmdbRatingResponse {
  Response?: string
  imdbRating?: string
  imdbVotes?: string
}

export interface ImdbRating {
  rating: number
  voteCount: number | null
}

export const parseImdbRating = (
  data: OmdbRatingResponse
): ImdbRating | null => {
  if (data.Response !== 'True' || !data.imdbRating) return null

  const rating = Number(data.imdbRating)
  if (!Number.isFinite(rating) || rating < 0 || rating > 10) return null

  const parsedVotes = data.imdbVotes
    ? Number(data.imdbVotes.replaceAll(',', ''))
    : Number.NaN

  return {
    rating,
    voteCount: Number.isFinite(parsedVotes) ? parsedVotes : null,
  }
}
