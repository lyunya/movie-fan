'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import type { HomeData } from '@/types/main'
import type { Film } from '@/server/catalog/types'
import { api } from '@/utils/api'
import { toSlug } from '@/utils/slug'
import { PERSON_PLACEHOLDER, filmFromSnapshot, filmImage } from '@/utils/film'
import MovieCard from '@/components/MovieCard/MovieCard'
import MovieRow from '@/components/MovieRow/MovieRow'
import SearchResults from '@/components/SearchResults/SearchResults'
import MovieCardSkeleton from '@/components/MovieCard/MovieCardSkeleton'
import News from '@/components/News/News'
import FeatureMarquee from '@/components/FeatureMarquee/FeatureMarquee'
import FrameGamePromo from '@/components/FrameGame/FrameGamePromo'
import { QueryError } from '@/components/ui/Feedback'
export default function HomeClient({ data }: { data: HomeData }) {
  const params = useSearchParams(),
    router = useRouter()
  const query = (params.get('q') || '').trim()
  const [value, setValue] = useState(query)
  const [kind, setKind] = useState<'movies' | 'people'>('movies')
  const [page, setPage] = useState(1)
  const [extra, setExtra] = useState<Film[]>([])
  const [moreError, setMoreError] = useState(false)
  const [busy, setBusy] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const { status } = useSession()
  const utils = api.useUtils()
  const results = api.catalog.search.useQuery(
    { query, page: 1 },
    { enabled: !!query, retry: 1 }
  )
  const forYou = api.catalog.forYou.useQuery(undefined, {
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
  const watchlist = (saved.data?.movies || []).filter((m) => m.inWatchlist)
  const availableShelf = watchlist
    .filter((m) => !m.watched && streamingIds.has(m.movieId))
    .slice(0, 6)
    .map(filmFromSnapshot)
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
  const films = [...(results.data?.films || []), ...extra].filter(
    (m, i, arr) => arr.findIndex((x) => x.id === m.id) === i
  )
  const seen = new Set<string>([
    ...(data.feature ? [data.feature.id] : []),
    ...watchlist.slice(0, 6).map((m) => m.movieId),
  ])
  const unique = (items: Film[], count = 10) =>
    items
      .filter((m) => !seen.has(m.id))
      .slice(0, count)
      .map((m) => {
        seen.add(m.id)
        return m
      })
  const personalized = unique(forYou.data?.films || [], 6)
  const trending = unique(data.trending)
  const theaters = unique(data.opening)
  const upcoming = unique(data.upcoming)
  // A few stills for the Frame Game teaser, from films not featured above
  const frameStills = data.topRated
    .map((m) => filmImage(m.backdropPath, 'w780'))
    .filter((url): url is string => !!url)
    .slice(0, 3)
  return (
    <main className="pb-12">
      <div className="page-shell !pb-6">
        {!query && (
          <div className="mb-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Your own little film club</p>
              <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-[1.05] sm:text-6xl">
                Find your next favorite.
                <br />
                <span className="italic text-zinc-400">
                  Make a night of it.
                </span>
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
          <h1 className="mb-5 text-2xl font-semibold">Results for “{query}”</h1>
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
              {films.length ? (
                <SearchResults>
                  {films.map((film) => (
                    <MovieCard key={film.id} film={film} />
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
                      const res = await utils.catalog.search.fetch({
                        query,
                        page: page + 1,
                      })
                      setExtra((old) => [...old, ...res.films])
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
                    prefetch={false}
                    key={person.id}
                    href={`/person/${toSlug(person.id, person.name)}`}
                    className="surface flex items-center gap-4 p-3"
                  >
                    <Image
                      src={
                        filmImage(person.profilePath, 'w185') ||
                        PERSON_PLACEHOLDER
                      }
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
          {watchlist.length > 0 && (
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
              films={
                availableShelf.length
                  ? availableShelf
                  : watchlist.slice(0, 6).map(filmFromSnapshot)
              }
            />
          )}
          <MovieRow
            eyebrow="Picked for you"
            title="A little more your thing"
            subtitle={
              forYou.data?.topGenre
                ? `Inspired by your interest in ${forYou.data.topGenre}`
                : undefined
            }
            films={personalized}
          />
          {data.feature && <FeatureMarquee film={data.feature} />}
          <MovieRow
            eyebrow="Trending this week"
            title="In the conversation"
            films={trending}
          />
          <div className="shell-x grid gap-6 py-5 lg:grid-cols-[1.2fr_1fr]">
            <News newsStories={data.news.slice(0, 4)} />
            <FrameGamePromo stills={frameStills} />
          </div>
          <MovieRow
            eyebrow="On the big screen"
            title="In theaters"
            films={theaters}
          />
          <MovieRow
            eyebrow="Mark your calendar"
            title="Coming soon"
            films={upcoming}
          />
          <div className="shell-x grid gap-5 pb-8 pt-5 md:grid-cols-2">
            {[
              {
                eyebrow: 'Admit one · Rankings',
                title: 'What makes your Top 10?',
                body: 'Rank the films you love. Give every favorite a place.',
                href: '/lists',
                cta: 'Build a ranked list',
              },
              {
                eyebrow: 'Admit one · Film passport',
                title: 'Collect a stamp for every era.',
                body: 'Every film you log earns stamps for its decade and genre. How well-traveled is your taste?',
                href: '/passport',
                cta: 'Open your passport',
              },
            ].map((t) => (
              <section
                key={t.href}
                className="ticket relative flex flex-col justify-between gap-5 rounded-2xl bg-gradient-to-br from-ink-raised to-[#231d25] p-6 px-9 ring-1 ring-inset ring-white/5 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="eyebrow text-gold">{t.eyebrow}</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
                    {t.title}
                  </h2>
                  <p className="mt-2 text-sm text-zinc-400">{t.body}</p>
                </div>
                <Link
                  className="btn-ghost shrink-0 !px-4 !text-sm"
                  href={t.href}
                >
                  {t.cta}
                </Link>
              </section>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
