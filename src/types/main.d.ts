import type { Film, FilmDetail } from '@/server/catalog/types'

export interface Image {
  url: string
  width?: number
  height?: number
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
export interface HomeData {
  popular: Film[]
  opening: Film[]
  upcoming: Film[]
  trending: Film[]
  topRated: Film[]
  news: NewStory[]
  /** The home marquee: one film, told well */
  feature: FilmDetail | null
}
