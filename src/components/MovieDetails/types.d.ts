import type { Credit } from '@/components/CastGrid/types'
import type { MovieCardProps } from '@/components/MovieCard/types'

export interface MovieDetailProps extends ComponentPropsWithRef<'div'> {
  id: string
  sessionData: Session | null
}

export interface IGenres {
  name: string
}

export interface IWatchProvider {
  name: string
  logoUrl: string
}

export interface IWatchProviders {
  flatrate: IWatchProvider[]
  rent: IWatchProvider[]
  buy: IWatchProvider[]
  link: string | null
}

export interface IMovieDetail {
  emsVersionId: string
  id: string
  name: string
  synopsis: string | null
  genres: IGenres[]
  posterImage: { url: string | null }
  backgroundImage: { url: string | null }
  releaseDate: string | null
  durationMinutes: number
  directedBy: string
  totalGross: string | null
  motionPictureRating: { code: string | null }
  tomatoMeter: number | null
  voteCount: number | null
  consensus: string | null
  trailer: { url: string | null }
  images: { url: string }[]
  cast: Credit[]
  crew: Credit[]
  watchProviders: IWatchProviders | null
  similar: MovieCardProps[]
}
