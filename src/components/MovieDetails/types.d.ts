export interface MovieDetailProps extends ComponentPropsWithRef<'div'> {
  id: string
  sessionData: Session | null
}

export interface IGenres {
  name: string[]
}

export interface IMovieDetail {
  genres: IGenres
  trailer: {
  url: string
}
  emsId: string
  id: string
  name: string
  synopsis: string
  tomatoRating: {
      tomatometer: number | null
      consensus: string | null
      iconImage: {
        url: string | null
      }
    }
  durationMinutes: number
  releaseDate: string
  directedBy: string
  posterImage: Image
  totalGross: string
  motionPictureRating: {
    code: string | null
  }
}

export interface MovieDetailInterface {
  data?: {
    movie: {
    synopsis: string
    durationMinutes: number
    directedBy: string
    backgroundImage: Image
    cast: Credit[]
    crew: Credit[]
    directedBy: string
    Images: Image[]
    genres: IGenres
    name: string
    posterImage: Image
    releaseDate: string
    totalGross: string | null
    motionPictureRating: {
      code: string | null
    }
    trailer: {
      url: string
    }
    tomatoRating: {
      tomatometer: number | null
      consensus: string | null
      iconImage: {
        url: string | null
      }
    }
  }
  }
}
