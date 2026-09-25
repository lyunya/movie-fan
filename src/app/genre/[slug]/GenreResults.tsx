'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import type { FilmPage } from '@/server/catalog/types'
import MovieCard from '@/components/MovieCard/MovieCard'
import MovieGrid from '@/components/MovieGrid/MovieGrid'
import { api } from '@/utils/api'
import { QueryError } from '@/components/ui/Feedback'
export default function GenreResults({
  genreId,
  initialPage,
}: {
  genreId: number
  initialPage: FilmPage
}) {
  const { status } = useSession()
  const user = api.user.query.useQuery(undefined, {
    enabled: status === 'authenticated',
  })
  const [page, setPage] = useState(1),
    [runtime, setRuntime] = useState(0),
    [decade, setDecade] = useState(0),
    [streaming, setStreaming] = useState(false)
  const result = api.catalog.discoverByGenre.useQuery(
    {
      genreId,
      page,
      maxRuntime: runtime || undefined,
      decade: decade || undefined,
      streaming,
      region: user.data?.user?.watchRegion || 'US',
      providerIds: user.data?.user?.preferredProviders || [],
    },
    {
      initialData:
        page === 1 && !runtime && !decade && !streaming
          ? initialPage
          : undefined,
      staleTime: 60000,
    }
  )
  return (
    <>
      <div className="surface mb-6 flex flex-wrap items-end gap-4 p-4">
        <label className="field-label">
          Runtime
          <select
            className="field"
            value={runtime}
            onChange={(e) => {
              setRuntime(Number(e.target.value))
              setPage(1)
            }}
          >
            <option value={0}>Any length</option>
            <option value={100}>Under 100 minutes</option>
            <option value={120}>Under 2 hours</option>
          </select>
        </label>
        <label className="field-label">
          Decade
          <select
            className="field"
            value={decade}
            onChange={(e) => {
              setDecade(Number(e.target.value))
              setPage(1)
            }}
          >
            <option value={0}>Any decade</option>
            {Array.from({ length: 14 }, (_, i) => 2030 - i * 10).map((d) => (
              <option key={d} value={d}>
                {d}s
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={streaming}
            onChange={(e) => {
              setStreaming(e.target.checked)
              setPage(1)
            }}
          />
          {user.data?.user?.preferredProviders.length
            ? 'On my services'
            : 'Included with a subscription'}{' '}
          · {user.data?.user?.watchRegion || 'US'}
        </label>
        <Link
          href={status === 'authenticated' ? '/profile' : '/tonight'}
          className="py-3 text-sm text-pink-300"
        >
          Change region & services
        </Link>
      </div>
      {result.isLoading && (
        <p role="status" className="py-12">
          Finding films…
        </p>
      )}
      {result.isError && <QueryError retry={() => result.refetch()} />}
      {result.data && (
        <>
          <MovieGrid
            movieCards={result.data.films.map((film) => (
              <MovieCard key={film.id} film={film} />
            ))}
          />
          {!result.data.films.length && (
            <p className="surface p-8">
              No films match. Try a wider decade or runtime.
            </p>
          )}
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              className="btn-ghost"
              disabled={page === 1 || result.isFetching}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span className="text-sm text-zinc-400">
              Page {page} of {Math.max(1, result.data.totalPages)}
            </span>
            <button
              className="btn-ghost"
              disabled={page >= result.data.totalPages || result.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </>
  )
}
