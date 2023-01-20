import { useState } from 'react'
import type { GetStaticProps } from 'next'
import type { NextPage } from 'next'
import type { HomePageProps } from '@/types/main'
import type { MovieCardProps } from '@/components/MovieCard/types'
import type { ChangeEvent } from 'react'

import Layout from '@layout/default'
import MovieCard from '@/components/MovieCard/MovieCard'
import Carousel from '@/components/Carousel/Carousel'
import Search from '@/components/Search/Search'
import News from '@/components/News/News'
import SearchResults from '@/components/SearchResults/SearchResults'

import { getSearchMovies } from '@/utils/getSearchMovies'
import { getUpcomingMovies } from '@/utils/getUpcomingMovies'
import { getPopularMovies } from '@/utils/getPopularMovies'
import debounce from '@/utils/debounce'
import { getNews } from '@/utils/getNews'

const Home: NextPage<HomePageProps> = ({ data }) => {
  const [results, setResults] = useState([])
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const { popularMovies, upcomingMovies, newsStories } = data
  const {
    data: { opening: moviesOpening, popularity: moviesPopular },
  } = popularMovies
  const {
    data: { upcoming: upComingMovies },
  } = upcomingMovies

  const handleSearch = async (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    if (query === '') {
      setResults([])
      return
    }
    setIsLoadingSearch(true)
    const results = await getSearchMovies(query)
    const movies = results.data.search.movies
    setIsLoadingSearch(false)
    setResults(movies)
  }

  const debouncedSearch = debounce(handleSearch, 750)

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
    return <MovieCard key={idx} {...(movie as MovieCardProps)} />
  })

  return (
    <Layout>
      <main className="grid items-center">
        <div className="mx-auto flex flex-col justify-between">
          <Search loading={isLoadingSearch} handleSearch={debouncedSearch} />
          <div className={results.length ? 'hidden' : ''}>
            <News newsStories={newsStories} />
          </div>
        </div>
        {results.length > 0 ? (
          <SearchResults movieCards={searchedMovieCards} />
        ) : (
          <>
            <h2 className="pl-8 pt-2 text-left text-3xl text-white sm:pb-4 sm:pt-8 md:text-5xl">
              Popular
            </h2>
            <Carousel movieCards={popularMovieCards} />
            <h2 className="pl-8 text-left text-3xl text-white sm:pb-4 md:text-5xl">
              Opening this week
            </h2>
            <Carousel movieCards={openingMovieCards} />
            <h2 className="pl-8 text-left text-3xl text-white sm:pb-4 md:text-5xl">
              Upcoming
            </h2>
            <Carousel movieCards={upcomingMovieCards} />
          </>
        )}
      </main>
    </Layout>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const upcomingMovies = await getUpcomingMovies()
    const popularMovies = await getPopularMovies()
    const news = await getNews()
    const newsStories = news.data.newsStories
    return {
      props: { data: { upcomingMovies, popularMovies, newsStories } },
      revalidate: 60 * 60,
    }
  } catch (error) {
    return { props: { error } }
  }
}
export default Home
