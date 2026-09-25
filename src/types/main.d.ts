import type { MovieCardProps } from './../components/MovieCard/types.d'

export interface Image {
  url: string
  width?: number
  height?: number
}

export interface Credit {
  name: string
  role: string
  characterName: string
}

export interface NewStory {
  source?: string
  publishedAt?: string
  topic?: string
  coverage?: { title: string; link: string; source?: string }[]
  id: string
  title: string
  mainImage: Image
  link: string
}
export interface HomePageProps {
  data: {
    popularMovies: {
      data: {
        opening: MovieCardProps[]
        popularity: MovieCardProps[]
      }
    }
    upcomingMovies: {
      data: {
        upcoming: MovieCardProps[]
      }
    }
    newsStories: NewStory[]
  }
}

export interface MoviePageProps {
  id: string
}

export interface HomeData {
  popular: MovieCardProps[]
  opening: MovieCardProps[]
  upcoming: MovieCardProps[]
  trending: MovieCardProps[]
  topRated: MovieCardProps[]
  news: NewStory[]
  /** The home marquee: one film, told well */
  feature: HomeFeature | null
}

export interface HomeFeature {
  id: string
  name: string
  tagline: string | null
  synopsis: string | null
  backdropUrl: string
  posterUrl: string | null
  year: string | null
  runtimeMinutes: number | null
  genres: string[]
  director: string | null
  certification: string | null
  trailerUrl: string | null
  score: string | null
}
