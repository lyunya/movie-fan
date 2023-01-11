import { useState } from "react";
import type { GetServerSideProps} from "next";
import { type NextPage } from "next";
import type { HomePageProps, NewStory } from "@/types/main";
import type { ChangeEvent} from "react";

import Layout from "@layout/default";
import MovieCard from "@/components/MovieCard/MovieCard";
import Carousel from "@/components/Carousel/Carousel"
import Search from "@/components/Search/Search"
import SearchResults from "@/components/SearchResults/SearchResults"
import News from "@/components/News/News"

import { getSearchMovies } from "@/utils/getSearchMovies"
import { getUpcomingMovies } from "@/utils/getUpcomingMovies"
import { getPopularMovies } from "@/utils/getPopularMovies"
import debounce from "@/utils/debounce"
import type { MovieCardProps } from "@/components/MovieCard/types";
import { getNews } from "@/utils/getNews";

const Home: NextPage<HomePageProps> = ({ data }) => {
  const [results, setResults] = useState([])
  const { popularMovies, upcomingMovies, newsStories } = data
  const { data: { opening: moviesOpening, popularity: moviesPopular } } = popularMovies
  const { data: { upcoming: upComingMovies } } = upcomingMovies

  const handleSearch = async (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    if (query === '') {
      setResults([])
      return
    }
    const results = await getSearchMovies(query)
    const movies = results.data.search.movies
    setResults(movies)
  }

  const debouncedSearch = debounce(handleSearch, 500)

  const popularMovieCards = moviesPopular.map((movie, idx) => {
    return <MovieCard key={idx} {...movie} />
  })

  const openingMovieCards = moviesOpening.map((movie, idx) => {
    return <MovieCard key={idx} {...movie} />
  })

  const upcomingMovieCards = upComingMovies.map((movie, idx) => {
    return <MovieCard key={idx} {...movie} />
  })

  const searchedMovieCards = results.map((movie, idx) => {
    return <MovieCard key={idx} {...movie as MovieCardProps} />
  })

  return (
    <Layout>
      <main className="grid items-center">
        <div className="flex flex-col justify-between mx-auto w-full">
        <Search handleSearch={debouncedSearch} />
          <div className={results.length ? 'hidden' : 'w-full'}>
            <News newsStories={newsStories} />
          </div>
        </div>
        {results.length > 0 ? <SearchResults movieCards={searchedMovieCards} /> : 
          <>
            <h2 className="text-white text-3xl md:text-5xl text-left pl-8 sm:pb-4 pt-2 sm:pt-8">Popular</h2>
            <Carousel movieCards={popularMovieCards} />
            <h2 className="text-white text-3xl md:text-5xl text-left pl-8 sm:pb-4">Opening this week</h2>
            <Carousel movieCards={openingMovieCards} />
            <h2 className="text-white text-3xl md:text-5xl text-left pl-8 sm:pb-4">Upcoming</h2>
            <Carousel movieCards={upcomingMovieCards} />
          </>}
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const upcomingMovies = await getUpcomingMovies()
    const popularMovies = await getPopularMovies()
    const news = await getNews()
    const newsStories = news.data.newsStories
    return { props: { data: { upcomingMovies, popularMovies, newsStories } } }
  } catch (error) {
    return { props: { error } }
  }
}
export default Home