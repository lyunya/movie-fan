import type { Image } from '@/types/main'
import type { ComponentPropsWithRef } from 'react'

export interface MovieCardProps extends ComponentPropsWithRef<'div'> {
  name: string
  posterImage: Image | string | null
  emsVersionId: string
  releaseDate?: string | null
  // 0-100 TMDB score, from either a live API result or the cached DB watchlist row
  tomatoMeter?: number | null
  // TMDB vote count (live API results only); 0 means nobody has rated it
  voteCount?: number | null
  // Optional IMDb enrichment used for focused recommendations.
  imdbRating?: number | null
  imdbVoteCount?: number | null
  // The signed-in user's own star rating (DB watchlist items only)
  userRating?: number | null
  // When set, renders a rank numeral on the poster
  rank?: number
  // Landscape still (only present on live TMDB list results)
  backdropUrl?: string | null
}
