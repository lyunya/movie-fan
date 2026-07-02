'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import parse from 'html-react-parser'
import Balancer from 'react-wrap-balancer'
import { keepPreviousData } from '@tanstack/react-query'
import type { HomeData, NewStory } from '@/types/main'
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
import { partitionNews, INITIAL_HEADLINES } from '@/utils/news'

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

/**
 * Compact poster strip that fills the space under the hero in the
 * side-by-side layout (the News column is naturally taller). Desktop-only:
 * on single-column mobile there's no gap to fill, and the full row for the
 * same list already renders further down the page.
 */
const MiniStrip = ({
  title,
  movies,
}: {
  title: string
  movies: MovieCardProps[]
}) => {
  if (!movies?.length) return null
  return (
    <section className="hidden lg:block">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
        <span className="gradient-text">{title}</span>
      </h2>
      <div className="hide-scrollbar flex gap-3 overflow-x-auto">
        {movies.slice(0, 6).map((movie) => {
          const posterSrc =
            (typeof movie.posterImage === 'string'
              ? movie.posterImage
              : movie.posterImage?.url) || '/placeholderposter.png'
          return (
            <Link
              key={movie.emsVersionId}
              href={`/movie/${movie.emsVersionId}`}
              title={movie.name}
              className="group w-24 shrink-0"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition duration-300 group-hover:border-zinc-600">
                <Image
                  src={posterSrc}
                  fill
                  sizes="96px"
                  alt={`${movie.name} poster`}
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <p className="mt-1.5 truncate text-xs font-semibold text-zinc-300 transition group-hover:text-pink-400">
                {movie.name}
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

/**
 * The next batch of headlines beyond what News already shows, spilled into
 * the leftover space below the hero/strip on desktop (the News column is
 * naturally taller). Hidden on mobile, where News's own "More news" toggle
 * covers the same stories in place.
 */
const MoreHeadlines = ({ stories }: { stories: NewStory[] }) => {
  if (stories.length === 0) return null
  return (
    <section className="hidden lg:block">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
        More headlines
      </h2>
      <ul className="surface flex flex-col divide-y divide-zinc-800">
        {stories.map((story) => (
          <li key={story.id}>
            <a
              // Same row styling as News's headline list, so a row here
              // takes up the same vertical space as one over there
              className="block px-4 py-3 text-base transition hover:bg-zinc-800/60 hover:text-pink-400 lg:text-lg"
              href={story.link}
              target="_blank"
              rel="noreferrer"
            >
              <Balancer>{parse(story.title)}</Balancer>
            </a>
          </li>
        ))}
      </ul>
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

  // The News column is naturally taller than the compact hero, so every
  // headline beyond what News already shows spills into the leftover space
  // in the left column instead of leaving it empty (fetchNews caps the feed
  // at 20 stories, so this list is bounded even without a slice end here).
  // Not memoized off `failedImages` (News tracks that internally) — worst
  // case is one headline briefly appearing on both sides if a feed image
  // 404s.
  const moreHeadlines = useMemo(() => {
    const { restStories } = partitionNews(news)
    return restStories.slice(INITIAL_HEADLINES)
  }, [news])

  return (
    <main className="pb-10">
      {!isSearching && (popular.length > 0 || hasNews) && (
        <div className="mx-auto grid max-w-screen-2xl grid-cols-1 items-start gap-6 px-4 py-6 sm:px-8 lg:grid-cols-2">
          {popular.length > 0 && (
            <div className="flex flex-col gap-6">
              <Hero movies={popular.slice(0, 5)} />
              {/* Fills the height difference against the taller News column */}
              <MiniStrip
                title={opening.length > 0 ? 'Opening this week' : 'Coming soon'}
                movies={opening.length > 0 ? opening : upcoming}
              />
              <MoreHeadlines stories={moreHeadlines} />
            </div>
          )}
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
