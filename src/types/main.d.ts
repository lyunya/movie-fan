import type { MovieCardProps } from './../components/MovieCard/types.d';

export interface Image {
  url: string;
  width: number;
  height: number;
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
      movie: {
        synopsis: ReactNode;
        durationMinutes: ReactNode;
        backgroundImage: Image,
        cast: Credit[],
        crew: Credit[],
        directedBy: string,
        Images: Image[],
        genres: {name: string}[],
        name: string,
        posterImage: Image,
        releaseDate: string,
        totalGross: string,
        motionPictureRating: {
          code: string,
        }
        trailer: {
          url: string
        },
        tomatoRating: {
          tomatometer: number,
          consensus: string,
          iconImage: {
            url: string
          }
        }
  
      }
  }