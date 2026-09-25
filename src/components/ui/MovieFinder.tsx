'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { api } from '@/utils/api'
import type { Film } from '@/server/catalog/types'
import { POSTER_PLACEHOLDER, filmImage, filmYear } from '@/utils/film'
export default function MovieFinder({
  onChoose,
  busy = false,
  initialQuery = '',
}: {
  onChoose: (film: Film) => void
  busy?: boolean
  initialQuery?: string
}) {
  const [value, setValue] = useState(initialQuery),
    [query, setQuery] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setQuery(value.trim()), 300)
    return () => clearTimeout(t)
  }, [value])
  const search = api.catalog.search.useQuery(
    { query, page: 1 },
    { enabled: query.length > 1 }
  )
  return (
    <div>
      <label className="field-label">
        Find a movie
        <input
          className="field"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search by title…"
        />
      </label>
      <div className="mt-3 max-h-[min(20rem,calc(100dvh-15rem))] space-y-2 overflow-y-auto overscroll-contain">
        {search.isFetching && (
          <p className="text-sm text-zinc-400">Searching…</p>
        )}
        {search.isError && (
          <p role="alert">
            Couldn’t search.{' '}
            <button onClick={() => search.refetch()} className="text-pink-300">
              Retry
            </button>
          </p>
        )}
        {search.data?.films.slice(0, 8).map((m) => (
          <button
            key={m.id}
            disabled={busy}
            className="flex w-full items-center gap-3 rounded-lg bg-zinc-900 p-2 text-left hover:bg-zinc-800"
            onClick={() => onChoose(m)}
          >
            <Image
              src={filmImage(m.posterPath, 'w92') || POSTER_PLACEHOLDER}
              width={36}
              height={54}
              alt=""
              className="rounded"
            />
            <span>
              {m.title}
              <span className="ml-2 text-sm text-zinc-400">{filmYear(m)}</span>
            </span>
          </button>
        ))}
        {query.length > 1 && search.isSuccess && !search.data.films.length && (
          <p>No matching films. Try another title.</p>
        )}
      </div>
    </div>
  )
}
