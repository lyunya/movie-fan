'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import type { HomeData } from '@/types/main'
import type { MovieCardProps } from '@/components/MovieCard/types'
import { api } from '@/utils/api'
import { toSlug } from '@/utils/slug'
import MovieCard from '@/components/MovieCard/MovieCard'
import MovieRow from '@/components/MovieRow/MovieRow'
import SearchResults from '@/components/SearchResults/SearchResults'
import MovieCardSkeleton from '@/components/MovieCard/MovieCardSkeleton'
import News from '@/components/News/News'
import { QueryError } from '@/components/ui/Feedback'
export default function HomeClient({ data }: { data: HomeData }) {
  const params = useSearchParams(),
    router = useRouter()
  const query = (params.get('q') || '').trim()
  const [value, setValue] = useState(query)
  const [kind, setKind] = useState<'movies' | 'people'>('movies')
  const [page, setPage] = useState(1)
  const [extra, setExtra] = useState<MovieCardProps[]>([])
  const [moreError, setMoreError] = useState(false)
  const [busy, setBusy] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const { status } = useSession()
  const utils = api.useUtils()
  const results = api.tmdb.search.useQuery(
    { query, page: 1 },
    { enabled: !!query, retry: 1 }
  )
  const forYou = api.tmdb.forYou.useQuery(undefined, {
    enabled: status === 'authenticated',
  })
  const saved = api.user.query.useQuery(undefined, {
    enabled: status === 'authenticated',
  })
  const available = api.user.libraryAvailability.useQuery(
    {},
    { enabled: status === 'authenticated' && !query, staleTime: 3600000 }
  )
  const streamingIds = new Set(available.data?.available.map((m) => m.movieId))
  const availableShelf =
    saved.data?.movies
      .filter((m) => m.inWatchlist && !m.watched && streamingIds.has(m.movieId))
      .slice(0, 6) || []
  useEffect(() => {
    setValue(query)
    setExtra([])
    setPage(1)
    setMoreError(false)
  }, [query])
  useEffect(() => () => clearTimeout(timer.current), [])
  const change = (next: string) => {
    setValue(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(
      () =>
        router.replace(
          next.trim() ? `/?q=${encodeURIComponent(next.trim())}` : '/',
          { scroll: false }
        ),
      350
    )
  }
  const movies = [...(results.data?.movies || []), ...extra].filter(
    (m, i, arr) => arr.findIndex((x) => x.emsVersionId === m.emsVersionId) === i
  )
  const spotlight = data.popular[0]
  const seen = new Set<string>([
    ...(spotlight ? [spotlight.emsVersionId] : []),
    ...(saved.data?.movies
      .filter((m) => m.inWatchlist)
      .slice(0, 6)
      .map((m) => m.movieId) || []),
  ])
  const unique = (items: MovieCardProps[], count = 10) =>
    items
      .filter((m) => !seen.has(m.emsVersionId))
      .slice(0, count)
      .map((m) => {
        seen.add(m.emsVersionId)
        return m
      })
  const personalized = unique(forYou.data?.movies || [], 6)
  const trending = unique(data.trending)
  const theaters = unique(data.opening)
  const upcoming = unique(data.upcoming)
  return (
    <main className="pb-12">
      <div className="page-shell !pb-6">
        {!query && (
          <div className="mb-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Your own little film club</p>
              <h1 className="mt-3 max-w-2xl font-heading text-4xl font-bold leading-tight sm:text-5xl">
                Find your next favorite.
                <br />
                <span className="text-zinc-400">Make a night of it.</span>
              </h1>
            </div>
            <Link href="/tonight" className="btn-brand self-start sm:shrink-0">
              Pick tonight’s movie ↗
            </Link>
          </div>
        )}
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            clearTimeout(timer.current)
            router.push(
              value.trim() ? `/?q=${encodeURIComponent(value.trim())}` : '/'
            )
          }}
          className="flex max-w-2xl gap-2"
        >
          <label className="flex-1">
            <span className="sr-only">Search movies and people</span>
            <input
              type="search"
              className="field !rounded-full !px-5"
              value={value}
              onChange={(e) => change(e.target.value)}
              placeholder="Search films, actors, directors…"
            />
          </label>
          {value && (
            <button
              type="button"
              className="btn-ghost !px-4"
              onClick={() => change('')}
            >
              Clear
            </button>
          )}
          <button className="sr-only">Search</button>
        </form>
      </div>
      {query ? (
        <section className="page-shell !pt-2">
          <h1 className="mb-5 text-2xl font-bold">Results for “{query}”</h1>
          <div
            className="mb-6 flex gap-2"
            role="group"
            aria-label="Result type"
          >
            {(['movies', 'people'] as const).map((k) => (
              <button
                key={k}
                className="filter-chip capitalize"
                aria-pressed={kind === k}
                onClick={() => setKind(k)}
              >
                {k}
              </button>
            ))}
          </div>
          {results.isError ? (
            <QueryError retry={() => results.refetch()} />
          ) : results.isLoading ? (
            <div className="flex gap-4">
              {[0, 1, 2].map((i) => (
                <MovieCardSkeleton key={i} />
              ))}
            </div>
          ) : kind === 'movies' ? (
            <>
              {movies.length ? (
                <SearchResults>
                  {movies.map((m) => (
                    <MovieCard key={m.emsVersionId} {...m} />
                  ))}
                </SearchResults>
              ) : (
                <p className="surface p-8">
                  No movies matched. Try a different title or check People.
                </p>
              )}
              {moreError && (
                <p role="alert" className="mt-5 text-red-300">
                  Couldn’t load more. Your results are still here; try again.
                </p>
              )}
              {page < (results.data?.totalPages || 1) && (
                <button
                  disabled={busy}
                  className="btn-ghost mt-8"
                  onClick={async () => {
                    setBusy(true)
                    setMoreError(false)
                    try {
                      const res = await utils.tmdb.search.fetch({
                        query,
                        page: page + 1,
                      })
                      setExtra((old) => [...old, ...res.movies])
                      setPage((p) => p + 1)
                    } catch {
                      setMoreError(true)
                    } finally {
                      setBusy(false)
                    }
                  }}
                >
                  {busy ? 'Loading…' : 'Load more movies'}
                </button>
              )}
            </>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {results.data?.people.length ? (
                results.data.people.map((person) => (
                  <Link
                    key={person.id}
                    href={`/person/${toSlug(person.id, person.name)}`}
                    className="surface flex items-center gap-4 p-3"
                  >
                    <Image
                      src={person.profileUrl || '/avatar.png'}
                      width={64}
                      height={64}
                      alt=""
                      className="h-16 w-16 rounded-full object-cover"
                    />
                    <div>
                      <h2 className="font-semibold">{person.name}</h2>
                      <p className="text-sm text-zinc-400">{person.knownFor}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p>No people matched this search.</p>
              )}
            </div>
          )}
        </section>
      ) : (
        <>
          {saved.data?.movies.some((m) => m.inWatchlist) && (
            <MovieRow
              title={
                availableShelf.length
                  ? 'From your watchlist, available tonight'
                  : 'Your next movie night'
              }
              subtitle={
                availableShelf.length
                  ? `Included with a subscription in ${available.data?.region || 'US'} · Open a film for service details`
                  : 'A few films you’ve been meaning to watch'
              }
              movies={
                availableShelf.length
                  ? availableShelf
                  : saved.data.movies.filter((m) => m.inWatchlist).slice(0, 6)
              }
            />
          )}
          <MovieRow
            title="A little more your thing"
            subtitle={
              forYou.data?.topGenre
                ? `Inspired by your interest in ${forYou.data.topGenre}`
                : undefined
            }
            movies={personalized}
          />
          <div className="page-shell !py-6">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
              {spotlight && (
                <section className="surface flex flex-col justify-between overflow-hidden p-5 sm:p-7">
                  <div>
                    <p className="eyebrow">In the spotlight</p>
                    <div className="mt-5 flex gap-5">
                      <Link
                        href={`/movie/${spotlight.emsVersionId}`}
                        className="shrink-0"
                      >
                        <Image
                          src={
                            (typeof spotlight.posterImage === 'string'
                              ? spotlight.posterImage
                              : spotlight.posterImage?.url) ||
                            '/placeholderposter.png'
                          }
                          width={150}
                          height={225}
                          alt={`${spotlight.name} poster`}
                          className="w-24 rounded-lg sm:w-36"
                        />
                      </Link>
                      <div className="self-center">
                        <h2 className="text-2xl font-bold sm:text-3xl">
                          {spotlight.name}
                        </h2>
                        <p className="mt-2 text-sm text-zinc-400">
                          See what everyone’s talking about.
                        </p>
                        <Link
                          className="btn-ghost mt-4 !px-4 !text-sm"
                          href={`/movie/${spotlight.emsVersionId}`}
                        >
                          Explore the film
                        </Link>
                      </div>
                    </div>
                  </div>
                </section>
              )}
              <News newsStories={data.news.slice(0, 4)} />
            </div>
          </div>
          <MovieRow
            title="In the conversation"
            subtitle="Trending this week"
            movies={trending}
          />
          <MovieRow title="In theaters" movies={theaters} />
          <MovieRow title="Coming soon" movies={upcoming} />
          <div className="page-shell !py-6">
            <section className="surface flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center">
              <div>
                <p className="eyebrow">A collection that’s unmistakably you</p>
                <h2 className="mt-2 text-2xl font-bold">
                  What makes your Top 10?
                </h2>
                <p className="mt-2 text-zinc-400">
                  Rank the films you love. Give every favorite a place.
                </p>
              </div>
              <Link className="btn-brand shrink-0" href="/lists">
                Build a ranked list
              </Link>
            </section>
          </div>
        </>
      )}
    </main>
  )
}
