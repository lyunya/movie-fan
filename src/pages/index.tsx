import { useRef, useState } from 'react'
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

import { api } from '@/utils/api'
import { getUpcomingMovies } from '@/utils/getUpcomingMovies'
import { getPopularMovies } from '@/utils/getPopularMovies'
import debounce from '@/utils/debounce'
import { getNews } from '@/utils/getNews'

const Home: NextPage<HomePageProps> = ({ data }) => {
  const [query, setQuery] = useState('')
  const { popularMovies, upcomingMovies, newsStories } = data
  const {
    data: { opening: moviesOpening, popularity: moviesPopular },
  } = popularMovies
  const {
    data: { upcoming: upComingMovies },
  } = upcomingMovies

  // React Query keys the request on the debounced query, so stale responses
  // can't overwrite newer ones and errors don't escape as unhandled rejections
  const searchQuery = api.flixster.search.useQuery(
    { query },
    // retry is capped so a failing search doesn't burn RapidAPI quota
    { enabled: query.length > 0, keepPreviousData: true, retry: 1 }
  )

  const debouncedSetQuery = useRef(
    debounce((value: string) => setQuery(value.trim()), 750)
  ).current

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    debouncedSetQuery(e.target.value)
  }

  const searchedMovies: MovieCardProps[] =
    (query && searchQuery.data?.movies) || []
  const noResultsFound =
    query.length > 0 && searchQuery.isSuccess && searchedMovies.length === 0

  const popularMovieCards =
    moviesPopular?.map((movie, idx) => {
      return <MovieCard key={idx} {...movie} />
    }) || []

  const openingMovieCards =
    moviesOpening?.map((movie, idx) => {
      return <MovieCard key={idx} {...movie} />
    }) || []

  const upcomingMovieCards =
    upComingMovies?.map((movie, idx) => {
      return <MovieCard key={idx} {...movie} />
    }) || []

  const searchedMovieCards = searchedMovies.map((movie, idx) => {
    return <MovieCard key={idx} {...movie} />
  })

  return (
    <Layout>
      <main className="grid items-center">
        <div className="mx-auto flex flex-col justify-between">
          <Search
            loading={searchQuery.isFetching}
            handleSearch={handleSearch}
          />
          {noResultsFound && (
            <p className="text-center text-2xl text-white">No results found</p>
          )}
          {searchQuery.isError && (
            <p className="text-center text-2xl text-white">
              Something went wrong searching, please try again
            </p>
          )}
          <div className={searchedMovieCards.length ? 'hidden' : ''}>
            <News newsStories={newsStories} />
          </div>
        </div>
        {searchedMovieCards.length > 0 ? (
          <SearchResults movieCards={searchedMovieCards} />
        ) : (
          <>
            {!!popularMovieCards.length && (
              <>
                <h2 className="pl-8 pt-2 text-left text-3xl text-white sm:pb-4 sm:pt-8 md:text-5xl">
                  Popular
                </h2>
                <Carousel movieCards={popularMovieCards} />
              </>
            )}
            {!!openingMovieCards.length && (
              <>
                <h2 className="pl-8 text-left text-3xl text-white sm:pb-4 md:text-5xl">
                  Opening this week
                </h2>
                <Carousel movieCards={openingMovieCards} />
              </>
            )}
            {!!upcomingMovieCards.length && (
              <>
                <h2 className="pl-8 text-left text-3xl text-white sm:pb-4 md:text-5xl">
                  Upcoming
                </h2>
                <Carousel movieCards={upcomingMovieCards} />
              </>
            )}
          </>
        )}
      </main>
    </Layout>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  // Each source falls back to an empty shape on its own, so one failing API
  // call can't take down the whole page or discard the other sections
  const [upcoming, popular, news] = await Promise.allSettled([
    getUpcomingMovies(),
    getPopularMovies(),
    getNews(),
  ])

  for (const result of [upcoming, popular, news]) {
    if (result.status === 'rejected') console.error(result.reason)
  }

  const upcomingMovies =
    upcoming.status === 'fulfilled' && upcoming.value?.data
      ? upcoming.value
      : { data: { upcoming: [] } }
  const popularMovies =
    popular.status === 'fulfilled' && popular.value?.data
      ? popular.value
      : { data: { opening: [], popularity: [] } }
  const newsStories =
    news.status === 'fulfilled' ? news.value?.data?.newsStories ?? [] : []

  const anyFailed = [upcoming, popular, news].some(
    (result) => result.status === 'rejected'
  )

  return {
    props: { data: { upcomingMovies, popularMovies, newsStories } },
    // Retry sooner when a source failed
    revalidate: anyFailed ? 60 : 60 * 60,
  }
}
export default Home
