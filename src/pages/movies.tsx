/* eslint-disable react-hooks/rules-of-hooks */
import { type NextPage } from "next";
import { useQuery } from '@tanstack/react-query'
import Layout from "@layout/default";
import { TMDB_API_KEY, TMDB_BASE_API_URL } from "@/data/Contstants";
import MovieCard from "@/components/MovieCard/MovieCard";
// import nowPlayingMovies from '../data/nowPlaying.json'

const movies: NextPage = () => {
  const getNowPlayingMovies = async () => { 
    const res = await fetch(`${TMDB_BASE_API_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=en-US&page=1`)
    const data = await res.json()
    return data
  }
  const { data, error, isLoading } = useQuery(['NowPlaying'], getNowPlayingMovies)

  if (error) return <div>Request Failed</div>;
  if (isLoading) return <div>Loading...</div>;
  
  const { results:movies } = data
  console.log(movies, 'these are the movies')

  return (
    <Layout >
      {movies.map((movie, idx) => {
        return <MovieCard key={idx} {...movie} />
      })}
      </Layout>
  )
}

export default movies