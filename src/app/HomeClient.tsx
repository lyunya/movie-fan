'use client'

import { useEffect, useRef, useState } from 'react'
import { keepPreviousData } from '@tanstack/react-query'
import type { HomeData } from '@/types/main'
import type { MovieCardProps } from '@/components/MovieCard/types'

import MovieCard from '@/components/MovieCard/MovieCard'
import MovieCardSkeleton from '@/components/MovieCard/MovieCardSkeleton'
import Carousel from '@/components/Carousel/Carousel'
import Hero from '@/components/Hero/Hero'
import Search, { saveRecentSearch } from '@/components/Search/Search'
import News from '@/components/News/News'
import SearchResults from '@/components/SearchResults/SearchResults'

import { api } from '@/utils/api'
import debounce from '@/utils/debounce'

const MovieRow = ({
  title,
  movies,
  ranked = false,
}: {
  title: string
  movies: MovieCardProps[]
  ranked?: boolean
}) => {
  if (!movies?.length) return null
  return (
    <section className="py-4">
      <h2 className="section-heading mx-auto max-w-screen-2xl px-4 pb-3 sm:px-8">
        <span className="gradient-text">{title}</span>
      </h2>
      <Carousel
        movieCards={movies.map((movie, idx) => (
          <MovieCard
            key={movie.emsVersionId}
            {...movie}
            rank={ranked && idx < 10 ? idx + 1 : undefined}
          />
        ))}
      />
    </section>
  )
}

export default function HomeClient({ data }: { data: HomeData }) {
  // inputValue is what's in the box; query is the debounced value that
  // actually drives the API request
  const [inputValue, setInputValue] = useState('')
  const [query, setQuery] = useState('')
  const { popular, opening, upcoming, news } = data

  // React Query keys the request on the debounced query, so stale responses
  // can't overwrite newer ones and errors don't escape as unhandled rejections
  const searchQuery = api.flixster.search.useQuery(
    { query },
    {
      enabled: query.length > 0,
      placeholderData: keepPreviousData,
      retry: 1,
    }
  )

  const debouncedSetQuery = useRef(
    debounce((value: string) => setQuery(value), 500)
  ).current

  const handleQueryChange = (value: string) => {
    setInputValue(value)
    const trimmed = value.trim()
    if (trimmed === '') {
      debouncedSetQuery.cancel()
      setQuery('')
    } else {
      debouncedSetQuery(trimmed)
    }
  }

  // Deep link: /?q=Tom+Hanks searches immediately (cast cards link here)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q')
    if (q?.trim()) {
      setInputValue(q)
      setQuery(q.trim())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isSearching = query.length > 0
  const results: MovieCardProps[] = searchQuery.data?.movies || []
  const showSkeletons = isSearching && searchQuery.isLoading
  const noResults = isSearching && searchQuery.isSuccess && results.length === 0

  // Remember searches that actually found something
  useEffect(() => {
    if (isSearching && searchQuery.isSuccess && results.length > 0) {
      saveRecentSearch(query)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isSearching, searchQuery.isSuccess, results.length])

  const hasNews = (news?.length ?? 0) > 0

  return (
    <main className="pb-10">
      {!isSearching && (popular.length > 0 || hasNews) && (
        <div className="mx-auto grid max-w-screen-2xl grid-cols-1 items-start gap-6 px-4 py-6 sm:px-8 lg:grid-cols-2">
          {popular.length > 0 && <Hero movies={popular.slice(0, 5)} />}
          {hasNews && <News newsStories={news} />}
        </div>
      )}

      <div className="px-4 py-6 sm:px-8">
        <Search
          value={inputValue}
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
          <MovieRow title="Top 10 today" movies={popular.slice(0, 10)} ranked />
          <MovieRow title="Popular" movies={popular.slice(10)} />
          <MovieRow title="Opening this week" movies={opening} />
          <MovieRow title="Upcoming" movies={upcoming} />
        </>
      )}
    </main>
  )
}
