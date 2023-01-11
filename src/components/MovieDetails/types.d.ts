export interface MovieDetailProps extends ComponentPropsWithRef<'div'> {
  id: string
  sessionData: Session | null
}

export interface MovieDetailInterface {
  data: {
    movie: {
    synopsis: string
    durationMinutes: string
    backgroundImage: Image
    cast: Credit[]
    crew: Credit[]
    directedBy: string
    Images: Image[]
    genres: { name: string }[]
    name: string
    posterImage: Image
    releaseDate: string
    totalGross: string
    motionPictureRating: {
      code: string
    }
    trailer: {
      url: string
    }
    tomatoRating: {
      tomatometer: number
      consensus: string
      iconImage: {
        url: string
      }
    }
  }
  }

}