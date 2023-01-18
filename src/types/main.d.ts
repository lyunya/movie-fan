import type { MovieCardProps } from './../components/MovieCard/types.d';

export interface Image {
  url: string;
  width?: number;
  height?: number;
}

export interface Credit {
  name: string;
  role: string;
  characterName: string;
}

export interface NewStory { 
  id: string;
  title: string;
  mainImage: Image;
  link: string;
}
export interface HomePageProps {
  data: {
    popularMovies: {
      data: {
        opening: MovieCardProps[],
        popularity: MovieCardProps[],
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
  id: string;
}
