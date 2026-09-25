'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { api } from '@/utils/api'
import LibraryImport from '@/components/ui/LibraryImport'
import MovieCard from '@/components/MovieCard/MovieCard'
import ProfileStats from '@/components/ProfileStats/ProfileStats'
import { toWatchlistCsv } from '@/utils/watchlistCsv'
import { notify, QueryError } from '@/components/ui/Feedback'
import { filmFromSnapshot, filmSummary } from '@/utils/film'
export default function LibraryClient() {
  const { status } = useSession(),
    utils = api.useUtils(),
    params = useSearchParams(),
    router = useRouter()
  const [selected, setSelected] = useState<string[]>([]),
    [limit, setLimit] = useState(48)
  const [bulkList, setBulkList] = useState('')
  const query = api.user.query.useQuery(undefined, {
    enabled: status === 'authenticated',
  })
  const streamingOnly = params.get('streaming') === 'yes'
  const availability = api.user.libraryAvailability.useInfiniteQuery(
    {},
    {
      enabled: status === 'authenticated' && streamingOnly,
      getNextPageParam: (last) => last.nextCursor,
      staleTime: 60 * 60 * 1000,
    }
  )
  const {
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isError: availabilityError,
  } = availability
  useEffect(() => {
    if (
      streamingOnly &&
      hasNextPage &&
      !isFetchingNextPage &&
      !availabilityError
    )
      void fetchNextPage()
  }, [
    streamingOnly,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    availabilityError,
  ])
  const streamingIds = new Set(
    availability.data?.pages.flatMap((p) =>
      p.available.map((m) => m.movieId)
    ) || []
  )
  const lists = api.lists.all.useQuery(undefined, {
    enabled: status === 'authenticated' && selected.length > 0,
  })
  const bulk = api.movie.bulk.useMutation({
    onSuccess: (result) => {
      utils.user.query.invalidate()
      notify(`${result.count} films updated`)
      setSelected([])
    },
    onError: () => notify('Your collection could not be updated.', 'error'),
  })
  const addToList = api.lists.addMovie.useMutation()
  const tab = params.get('tab') || 'watchlist',
    search = params.get('q') || '',
    sort = params.get('sort') || 'recent',
    genre = params.get('genre') || '',
    decade = params.get('decade') || '',
    runtime = Number(params.get('runtime') || 0),
    view = params.get('view') || 'grid'
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.replace(`/library?${next}`, { scroll: false })
    setLimit(48)
    setSelected([])
  }
  if (status === 'loading')
    return (
      <main className="page-shell">
        <div className="surface h-72 animate-pulse" />
      </main>
    )
  if (status !== 'authenticated')
    return (
      <main className="page-shell">
        <section className="surface mx-auto my-8 max-w-2xl p-8 text-center">
          <p className="eyebrow">A home for every favorite</p>
          <h1 className="mt-3 text-4xl font-semibold">
            Your movie life, remembered.
          </h1>
          <p className="mt-4 text-zinc-400">
            Keep a watchlist, remember what you’ve seen, and give your favorites
            a place.
          </p>
          <button className="btn-brand mt-6" onClick={() => signIn()}>
            Start your library
          </button>
          <Link href="/" className="mt-4 block text-sm text-pink-300">
            Explore movies first
          </Link>
        </section>
      </main>
    )
  const all = query.data?.movies || []
  const rows = all
    .filter(
      (m) =>
        (tab === 'watched'
          ? m.watched
          : tab === 'favorites'
            ? m.favorite
            : m.inWatchlist) &&
        m.name.toLowerCase().includes(search.toLowerCase()) &&
        (!streamingOnly || streamingIds.has(m.movieId)) &&
        (!genre || m.genres.includes(genre)) &&
        (!decade ||
          Math.floor(Number(m.releaseDate?.slice(0, 4)) / 10) * 10 ===
            Number(decade)) &&
        (!runtime || (m.durationMinutes > 0 && m.durationMinutes <= runtime)) &&
        (params.get('unrated') !== 'yes' || m.userRating == null)
    )
    .sort((a, b) =>
      sort === 'title'
        ? a.name.localeCompare(b.name)
        : sort === 'rating'
          ? (b.userRating || 0) - (a.userRating || 0)
          : sort === 'score'
            ? (b.tomatoMeter || 0) - (a.tomatoMeter || 0)
            : sort === 'watched'
              ? (b.lastWatchedAt?.getTime() || 0) -
                (a.lastWatchedAt?.getTime() || 0)
              : sort === 'oldest'
                ? (a.savedAt?.getTime() || 0) - (b.savedAt?.getTime() || 0)
                : (b.savedAt?.getTime() || 0) - (a.savedAt?.getTime() || 0)
    )
  const exportCsv = () => {
    const url = URL.createObjectURL(
      new Blob([toWatchlistCsv(all)], { type: 'text/csv;charset=utf-8' })
    )
    const a = document.createElement('a')
    a.href = url
    a.download = 'movie-fan-library.csv'
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <main className="page-shell">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Collected by you</p>
          <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">
            Your library
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/lists" className="btn-ghost !px-4">
            Lists & rankings
          </Link>
          <Link href="/diary" className="btn-ghost !px-4">
            Diary
          </Link>
          <LibraryImport existingIds={all.map((m) => m.movieId)} />
          <button className="btn-ghost !px-4" onClick={exportCsv}>
            Export
          </button>
        </div>
      </div>
      <div className="my-6 flex flex-wrap gap-2">
        {[
          ['watchlist', 'Watchlist', all.filter((m) => m.inWatchlist).length],
          ['watched', 'Watched', all.filter((m) => m.watched).length],
          ['favorites', 'Favorites', all.filter((m) => m.favorite).length],
        ].map(([key, label, count]) => (
          <button
            className="filter-chip"
            key={key}
            aria-pressed={tab === key}
            onClick={() => update('tab', String(key))}
          >
            {label} <span className="ml-1 text-zinc-400">{count}</span>
          </button>
        ))}
      </div>
      <section className="surface mb-6 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <label>
            <span className="sr-only">Search your library</span>
            <input
              className="field"
              value={search}
              onChange={(e) => update('q', e.target.value)}
              placeholder="Find a film in your library…"
            />
          </label>
          <label>
            <span className="sr-only">Sort movies</span>
            <select
              className="field"
              value={sort}
              onChange={(e) => update('sort', e.target.value)}
            >
              <option value="recent">Recently saved</option>
              <option value="oldest">Saved ages ago</option>
              <option value="watched">Recently watched</option>
              <option value="title">Title A–Z</option>
              <option value="rating">Your rating</option>
              <option value="score">TMDB score</option>
            </select>
          </label>
          <button
            className="btn-ghost !px-4"
            onClick={() => update('view', view === 'grid' ? 'list' : 'grid')}
          >
            {view === 'grid' ? 'List view' : 'Poster view'}
          </button>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={streamingOnly}
            onChange={(e) => update('streaming', e.target.checked ? 'yes' : '')}
          />
          {query.data?.user?.preferredProviders.length
            ? 'Available on my services'
            : 'Available with a subscription'}{' '}
          · {query.data?.user?.watchRegion || 'US'}
        </label>
        {streamingOnly && (
          <div className="mt-2 text-sm text-zinc-400" role="status">
            {availability.isLoading || availability.hasNextPage
              ? `Checking availability… ${availability.data?.pages.reduce((n, p) => n + p.checked, 0) || 0} films checked.`
              : 'Availability checked. Subscription access varies by plan.'}
            {availability.data?.pages.some((p) => p.failed.length > 0) && (
              <p>
                Some films could not be checked.{' '}
                <button
                  className="text-pink-300"
                  onClick={() => availability.refetch()}
                >
                  Try again
                </button>
              </p>
            )}
            {availability.isError && (
              <QueryError retry={() => availability.refetch()} />
            )}
            <Link className="ml-2 text-pink-300" href="/profile">
              Change services & region
            </Link>
          </div>
        )}
        <details className="mt-4">
          <summary className="text-sm text-zinc-300">
            Filters · {rows.length} matching films
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="field-label">
              Genre
              <select
                className="field"
                value={genre}
                onChange={(e) => update('genre', e.target.value)}
              >
                <option value="">All genres</option>
                {[...new Set(all.flatMap((m) => m.genres))].sort().map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Decade
              <select
                className="field"
                value={decade}
                onChange={(e) => update('decade', e.target.value)}
              >
                <option value="">All decades</option>
                {[
                  ...new Set(
                    all
                      .map(
                        (m) =>
                          Math.floor(Number(m.releaseDate?.slice(0, 4)) / 10) *
                          10
                      )
                      .filter((n) => n > 0)
                  ),
                ]
                  .sort((a, b) => b - a)
                  .map((d) => (
                    <option key={d} value={d}>
                      {d}s
                    </option>
                  ))}
              </select>
            </label>
            <label className="field-label">
              Runtime
              <select
                className="field"
                value={runtime}
                onChange={(e) => update('runtime', e.target.value)}
              >
                <option value="0">Any length</option>
                <option value="100">Under 100 minutes</option>
                <option value="120">Under 2 hours</option>
              </select>
            </label>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={params.get('unrated') === 'yes'}
              onChange={(e) => update('unrated', e.target.checked ? 'yes' : '')}
            />
            Unrated only
          </label>
          <button
            className="mt-3 text-sm text-pink-300"
            onClick={() => router.replace(`/library?tab=${tab}`)}
          >
            Reset filters
          </button>
        </details>
      </section>
      {query.isError ? (
        <QueryError
          message="Your library couldn’t be loaded. Your saved films are safe."
          retry={() => query.refetch()}
        />
      ) : query.isLoading ? (
        <div className="surface h-64 animate-pulse" />
      ) : rows.length ? (
        <>
          <p className="mb-4 text-sm text-zinc-400">
            {rows.length} films · Select films for bulk actions
          </p>
          {selected.length > 0 && (
            <div className="surface sticky top-20 z-30 mb-5 flex flex-wrap items-center gap-2 p-3">
              <span className="mr-2 text-sm">{selected.length} selected</span>
              <button
                disabled={bulk.isPending}
                className="btn-ghost !px-3 !py-2 !text-sm"
                onClick={() =>
                  bulk.mutate({ movieIds: selected, action: 'watched' })
                }
              >
                Mark watched
              </button>
              <button
                disabled={bulk.isPending}
                className="btn-ghost !px-3 !py-2 !text-sm"
                onClick={() =>
                  bulk.mutate({
                    movieIds: selected,
                    action: tab === 'watchlist' ? 'unsave' : 'save',
                  })
                }
              >
                {tab === 'watchlist' ? 'Unsave' : 'Save to watchlist'}
              </button>
              <select
                aria-label="Choose a list"
                className="field !w-auto"
                value={bulkList}
                onChange={(e) => setBulkList(e.target.value)}
              >
                <option value="">Add to list…</option>
                {lists.data?.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <button
                disabled={!bulkList || addToList.isPending}
                className="btn-ghost !px-3 !py-2"
                onClick={async () => {
                  const films = all.filter((m) => selected.includes(m.movieId))
                  let failed = 0
                  for (const m of films) {
                    try {
                      await addToList.mutateAsync({
                        listId: bulkList,
                        movie: filmSummary(filmFromSnapshot(m)),
                      })
                    } catch {
                      failed++
                    }
                  }
                  notify(
                    failed
                      ? `${failed} films could not be added. Please retry.`
                      : `${films.length} films added`,
                    failed ? 'error' : 'success'
                  )
                  if (!failed) setSelected([])
                  utils.lists.all.invalidate()
                }}
              >
                Add
              </button>
              <button
                className="p-2 text-sm text-pink-300"
                onClick={() => setSelected([])}
              >
                Cancel selection
              </button>
            </div>
          )}
          <div
            className={
              view === 'grid'
                ? 'grid grid-cols-2 justify-items-center gap-x-3 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
                : 'space-y-2'
            }
          >
            {rows.slice(0, limit).map((m) => (
              <div
                key={m.id}
                className={
                  view === 'grid'
                    ? 'relative'
                    : 'surface flex items-center gap-3 p-3'
                }
              >
                <label
                  className={
                    view === 'grid'
                      ? 'mb-2 flex items-center gap-2 text-xs text-zinc-400'
                      : 'flex items-center'
                  }
                >
                  <input
                    type="checkbox"
                    aria-label={`Select ${m.name}`}
                    checked={selected.includes(m.movieId)}
                    onChange={(e) =>
                      setSelected((old) =>
                        e.target.checked
                          ? [...old, m.movieId].slice(0, 100)
                          : old.filter((x) => x !== m.movieId)
                      )
                    }
                  />
                  {view === 'grid' ? 'Select' : null}
                </label>
                {view === 'grid' ? (
                  <MovieCard
                    film={filmFromSnapshot(m)}
                    userRating={m.userRating}
                  />
                ) : (
                  <>
                    <Link
                      prefetch={false}
                      className="flex-1 font-semibold"
                      href={`/movie/${m.movieId}`}
                    >
                      {m.name}
                      <span className="ml-2 text-sm text-zinc-400">
                        {m.releaseDate?.slice(0, 4)}
                      </span>
                    </Link>
                    <span className="text-sm text-yellow-300">
                      {m.userRating ? `${m.userRating}★` : 'Unrated'}
                    </span>
                    <span className="hidden text-xs text-zinc-400 sm:block">
                      {m.watched ? 'Watched' : 'To watch'}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
          {limit < rows.length && (
            <button
              className="btn-ghost mt-8"
              onClick={() => setLimit((n) => n + 48)}
            >
              Load more films
            </button>
          )}
        </>
      ) : (
        <section className="surface p-10 text-center">
          <h2 className="text-2xl font-semibold">
            {all.length
              ? 'No films match these filters.'
              : 'Your collection starts with one film.'}
          </h2>
          <Link href="/" className="btn-brand mt-5">
            Find a film
          </Link>
        </section>
      )}
      {!!all.length && (
        <details className="mt-12">
          <summary className="text-pink-300">Explore your taste</summary>
          <div className="mt-6">
            <ProfileStats movies={all} />
          </div>
        </details>
      )}
    </main>
  )
}
