'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CgSpinner } from 'react-icons/cg'
import parse from 'html-react-parser'
import Balancer from 'react-wrap-balancer'
import { keepPreviousData } from '@tanstack/react-query'
import type { HomeData, NewStory } from '@/types/main'
import type { MovieCardProps } from '@/components/MovieCard/types'
import type { Credit } from '@/components/CastGrid/types'

import MovieCard from '@/components/MovieCard/MovieCard'
import MovieCardSkeleton from '@/components/MovieCard/MovieCardSkeleton'
import MovieRow from '@/components/MovieRow/MovieRow'
import TrendingRow from '@/components/TrendingRow/TrendingRow'
import Hero from '@/components/Hero/Hero'
import Search, { saveRecentSearch } from '@/components/Search/Search'
import News from '@/components/News/News'
import SearchResults from '@/components/SearchResults/SearchResults'
import CastGrid from '@/components/CastGrid/CastGrid'

import { api } from '@/utils/api'
import { getPosterSrc } from '@/utils/getPosterSrc'
import debounce from '@/utils/debounce'
import { partitionNews, INITIAL_HEADLINES } from '@/utils/news'

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
          const posterSrc = getPosterSrc(movie.posterImage)
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const utils = api.useUtils()
  const { status: sessionStatus } = useSession()

  // Personalized row for signed-in users with a watchlist. Renders nothing
  // (MovieRow returns null) for signed-out users or empty watchlists.
  const forYou = api.tmdb.forYou.useQuery(undefined, {
    enabled: sessionStatus === 'authenticated',
    staleTime: 60_000,
  })

  // inputValue is what's in the box; query is the debounced value that
  // actually drives the API request
  const [inputValue, setInputValue] = useState('')
  const [query, setQuery] = useState('')
  // Movie pages beyond page 1 (page 1 lives in the query cache), plus the
  // current page cursor for "Load more"
  const [extraMovies, setExtraMovies] = useState<MovieCardProps[]>([])
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const { popular, opening, upcoming, trending, topRated, news } = data

  // React Query keys the request on the debounced query, so stale responses
  // can't overwrite newer ones and errors don't escape as unhandled rejections
  const searchQuery = api.tmdb.search.useQuery(
    { query, page: 1 },
    {
      enabled: query.length > 0,
      placeholderData: keepPreviousData,
      retry: 1,
    }
  )

  // Debounced: set the query that drives the request AND sync the URL, so
  // browser back/forward and shared links restore the search.
  const debouncedSearch = useRef(
    debounce((value: string) => {
      setQuery(value)
      router.replace(`/?q=${encodeURIComponent(value)}`, { scroll: false })
    }, 500)
  ).current

  const handleQueryChange = (value: string) => {
    setInputValue(value)
    const trimmed = value.trim()
    if (trimmed === '') {
      debouncedSearch.cancel()
      setQuery('')
      router.replace('/', { scroll: false })
    } else {
      debouncedSearch(trimmed)
    }
  }

  // React to ?q= from the Nav search, deep links, and back/forward
  const urlQuery = searchParams.get('q') ?? ''
  useEffect(() => {
    const trimmed = urlQuery.trim()
    if (trimmed) {
      setInputValue(urlQuery)
      setQuery(trimmed)
    }
  }, [urlQuery])

  // A new query resets the appended pages
  useEffect(() => {
    setExtraMovies([])
    setPage(1)
  }, [query])

  const isSearching = query.length > 0
  const base = searchQuery.data
  const people = base?.people ?? []
  const totalPages = base?.totalPages ?? 1
  const totalResults = base?.totalResults ?? 0
  const hasMore = page < totalPages

  // page 1 (from cache) + any appended pages, deduped by id
  const results: MovieCardProps[] = useMemo(() => {
    const seen = new Set<string>()
    const out: MovieCardProps[] = []
    for (const movie of [...(base?.movies ?? []), ...extraMovies]) {
      if (seen.has(movie.emsVersionId)) continue
      seen.add(movie.emsVersionId)
      out.push(movie)
    }
    return out
  }, [base?.movies, extraMovies])

  const peopleCredits: Credit[] = people.map((person) => ({
    id: String(person.id),
    name: person.name,
    characterName: person.knownFor ?? undefined,
    headShotImage: person.profileUrl ? { url: person.profileUrl } : undefined,
  }))

  const showSkeletons = isSearching && searchQuery.isLoading
  const noResults =
    isSearching &&
    searchQuery.isSuccess &&
    results.length === 0 &&
    people.length === 0

  const loadMore = async () => {
    if (loadingMore) return
    setLoadingMore(true)
    try {
      const next = page + 1
      const res = await utils.tmdb.search.fetch({ query, page: next })
      setExtraMovies((prev) => {
        const seen = new Set(
          [...(base?.movies ?? []), ...prev].map((m) => m.emsVersionId)
        )
        return [...prev, ...res.movies.filter((m) => !seen.has(m.emsVersionId))]
      })
      setPage(next)
    } catch {
      /* transient failure — leave the button so the user can retry */
    } finally {
      setLoadingMore(false)
    }
  }

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
                  ({totalResults.toLocaleString()})
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
              No results for &ldquo;{query}&rdquo;.
            </p>
          )}

          {/* People matches — link to their filmography */}
          {!showSkeletons && peopleCredits.length > 0 && (
            <div className="mx-auto max-w-screen-xl px-4 sm:px-8">
              <CastGrid cast={peopleCredits} title="People" />
            </div>
          )}

          {showSkeletons && (
            <SearchResults>
              {Array.from({ length: 10 }).map((_, idx) => (
                <MovieCardSkeleton key={idx} />
              ))}
            </SearchResults>
          )}

          {!showSkeletons && results.length > 0 && (
            <>
              {peopleCredits.length > 0 && (
                <h3 className="section-heading mx-auto max-w-screen-xl px-4 pb-4 pt-2 sm:px-8">
                  Movies
                </h3>
              )}
              <SearchResults>
                {results.map((movie) => (
                  <MovieCard key={movie.emsVersionId} {...movie} />
                ))}
              </SearchResults>
              {hasMore && (
                <div className="mt-10 flex justify-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="btn-ghost"
                    aria-label="Load more results"
                  >
                    {loadingMore ? (
                      <CgSpinner className="h-5 w-5 animate-spin" />
                    ) : (
                      'Load more results'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        <>
          <MovieRow
            title="For you"
            movies={forYou.data?.movies ?? []}
            subtitle={
              forYou.data?.topGenre
                ? `Because you save ${forYou.data.topGenre} movies`
                : undefined
            }
          />
          <TrendingRow initialWeek={trending} />
          <MovieRow title="Top 10 today" movies={popular.slice(0, 10)} ranked />
          <MovieRow title="Opening this week" movies={opening} />
          <MovieRow title="Top rated" movies={topRated} />
          <MovieRow title="Upcoming" movies={upcoming} />
        </>
      )}
    </main>
  )
}
