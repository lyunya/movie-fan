import { useRef, useState } from 'react'
import type { GetStaticProps } from 'next'
import type { NextPage } from 'next'
import type { HomePageProps } from '@/types/main'
import type { MovieCardProps } from '@/components/MovieCard/types'

import Layout from '@layout/default'
import MovieCard from '@/components/MovieCard/MovieCard'
import MovieCardSkeleton from '@/components/MovieCard/MovieCardSkeleton'
import Carousel from '@/components/Carousel/Carousel'
import Hero from '@/components/Hero/Hero'
import Search from '@/components/Search/Search'
import News from '@/components/News/News'
import SearchResults from '@/components/SearchResults/SearchResults'

import { api } from '@/utils/api'
import { getUpcomingMovies } from '@/utils/getUpcomingMovies'
import { getPopularMovies } from '@/utils/getPopularMovies'
import debounce from '@/utils/debounce'
import { getNews } from '@/utils/getNews'

const MovieRow = ({
  title,
  movies,
}: {
  title: string
  movies: MovieCardProps[]
}) => {
  if (!movies?.length) return null
  return (
    <section className="py-4">
      <h2 className="section-heading mx-auto max-w-screen-2xl px-4 pb-3 sm:px-8">
        <span className="gradient-text">{title}</span>
      </h2>
      <Carousel
        movieCards={movies.map((movie) => (
          <MovieCard key={movie.emsVersionId} {...movie} />
        ))}
      />
    </section>
  )
}

const Home: NextPage<HomePageProps> = ({ data }) => {
  const [query, setQuery] = useState('')
  const { popularMovies, upcomingMovies, newsStories } = data
  const moviesPopular = popularMovies.data.popularity || []
  const moviesOpening = popularMovies.data.opening || []
  const upComingMovies = upcomingMovies.data.upcoming || []

  // React Query keys the request on the debounced query, so stale responses
  // can't overwrite newer ones and errors don't escape as unhandled rejections
  const searchQuery = api.flixster.search.useQuery(
    { query },
    { enabled: query.length > 0, keepPreviousData: true, retry: 1 }
  )

  const debouncedSetQuery = useRef(
    debounce((value: string) => setQuery(value), 500)
  ).current

  const handleQueryChange = (value: string) => {
    const trimmed = value.trim()
    if (trimmed === '') {
      // Clear instantly; cancel any pending debounced update
      debouncedSetQuery.cancel()
      setQuery('')
    } else {
      debouncedSetQuery(trimmed)
    }
  }

  const isSearching = query.length > 0
  const results: MovieCardProps[] = searchQuery.data?.movies || []
  const showSkeletons = isSearching && searchQuery.isLoading
  const noResults = isSearching && searchQuery.isSuccess && results.length === 0
  const featured = moviesPopular[0]

  return (
    <Layout>
      <main className="pb-10">
        {!isSearching && featured && <Hero movie={featured} />}

        <div className="px-4 py-6 sm:px-8">
          <Search
            loading={searchQuery.isFetching}
            onQueryChange={handleQueryChange}
          />
        </div>

        {isSearching ? (
          <section>
            <h2 className="section-heading mx-auto max-w-screen-xl px-4 pb-4 sm:px-8">
              {searchQuery.isSuccess && !noResults ? (
                <>
                  Results for{' '}
                  <span className="gradient-text">&ldquo;{query}&rdquo;</span>{' '}
                  <span className="text-lg font-normal text-zinc-500">
                    ({results.length})
                  </span>
                </>
              ) : (
                <>
                  Searching{' '}
                  <span className="gradient-text">&ldquo;{query}&rdquo;</span>
                </>
              )}
            </h2>

            {searchQuery.isError && (
              <p className="py-10 text-center text-xl text-zinc-300">
                Something went wrong searching. Please try again.
              </p>
            )}

            {noResults && (
              <p className="py-10 text-center text-xl text-zinc-300">
                No movies found for &ldquo;{query}&rdquo;.
              </p>
            )}

            {showSkeletons && (
              <SearchResults>
                {Array.from({ length: 10 }).map((_, idx) => (
                  <MovieCardSkeleton key={idx} />
                ))}
              </SearchResults>
            )}

            {!showSkeletons && results.length > 0 && (
              <SearchResults>
                {results.map((movie) => (
                  <MovieCard key={movie.emsVersionId} {...movie} />
                ))}
              </SearchResults>
            )}
          </section>
        ) : (
          <>
            <MovieRow title="Popular" movies={moviesPopular} />
            <MovieRow title="Opening this week" movies={moviesOpening} />
            <MovieRow title="Upcoming" movies={upComingMovies} />
            <News newsStories={newsStories} />
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
