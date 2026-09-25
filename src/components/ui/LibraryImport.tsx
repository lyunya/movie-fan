'use client'
import { useRef, useState } from 'react'
import { api } from '@/utils/api'
import { parseLibraryCsv, type ImportRow } from '@/utils/importCsv'
import Dialog from './Dialog'
import MovieFinder from './MovieFinder'

type Row = ImportRow & { match?: string; skip?: boolean; result?: string }
export default function LibraryImport({
  existingIds,
}: {
  existingIds: string[]
}) {
  const [open, setOpen] = useState(false),
    [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [progress, setProgress] = useState('')
  const [resolve, setResolve] = useState<number | null>(null)
  const cancelled = useRef(false)
  const utils = api.useUtils()
  const save = api.movie.importMovie.useMutation()
  const duplicates = new Set<string>(existingIds)
  const eligible = rows.map((row) => {
    const duplicate = !!row.movieId && duplicates.has(row.movieId)
    if (!row.skip && row.movieId) duplicates.add(row.movieId)
    return !row.skip && !row.result && !!row.movieId && !duplicate
  })
  const count = eligible.filter(Boolean).length
  const unresolved = rows.filter((row) => !row.skip && !row.movieId).length
  const load = async (file?: File) => {
    if (!file) return
    setError('')
    setRows([])
    setBusy(true)
    cancelled.current = false
    try {
      if (file.size > 2_000_000)
        throw new Error('Choose a CSV smaller than 2 MB.')
      const parsed: Row[] = parseLibraryCsv(await file.text())
      for (let i = 0; i < parsed.length; i++) {
        if (cancelled.current) return
        const row = parsed[i]!
        setProgress(`Matching film ${i + 1} of ${parsed.length}…`)
        if (row.movieId) {
          try {
            const { movie } = await utils.tmdb.details.fetch({
              id: row.movieId,
            })
            if (!movie) row.movieId = ''
            else
              row.match = `${movie.name} (${movie.releaseDate?.slice(0, 4) || 'year unknown'})`
          } catch {
            row.movieId = ''
          }
        } else {
          try {
            const results = await utils.tmdb.search.fetch({
              query: row.title,
              page: 1,
            })
            const matches = results.movies.filter(
              (m) =>
                m.name.toLowerCase() === row.title.toLowerCase() &&
                (!row.year || m.releaseDate?.slice(0, 4) === row.year)
            )
            if (matches.length === 1) {
              row.movieId = matches[0]!.emsVersionId
              row.match = `${matches[0]!.name} (${matches[0]!.releaseDate?.slice(0, 4) || 'year unknown'})`
            }
          } catch {
            /* Leave failed lookups available for manual resolution. */
          }
        }
      }
      if (!cancelled.current) setRows(parsed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read this file.')
    } finally {
      setBusy(false)
      setProgress('')
    }
  }
  const commit = async () => {
    setBusy(true)
    setError('')
    cancelled.current = false
    let added = 0,
      skipped = 0,
      failed = 0
    for (let i = 0; i < rows.length; i++) {
      if (cancelled.current) break
      if (!eligible[i]) continue
      const row = rows[i]!
      setProgress(`Importing ${row.title}…`)
      try {
        const result = await save.mutateAsync({
          movieId: row.movieId,
          rating: row.rating,
          watchedDate: row.watchedDate,
        })
        if (result.added) added++
        else skipped++
        setRows((current) =>
          current.map((r, j) =>
            j === i
              ? {
                  ...r,
                  result: result.added ? 'Imported' : 'Already in your library',
                }
              : r
          )
        )
      } catch {
        failed++
      }
    }
    await utils.user.query.invalidate()
    await utils.diary.invalidate()
    setProgress(
      `${added} imported · ${skipped} already in your library${failed ? ` · ${failed} failed; retry the remaining films` : ''}${cancelled.current ? ' · Stopped' : ''}`
    )
    setBusy(false)
  }
  return (
    <>
      <button
        className="btn-ghost !px-4"
        onClick={() => {
          setOpen(true)
          setResolve(null)
          setRows([])
          setProgress('')
          setError('')
        }}
      >
        Import CSV
      </button>
      <Dialog
        open={open}
        onClose={() => {
          if (!busy) setOpen(false)
        }}
        title="Bring your films along"
      >
        <p className="mb-4 text-sm text-zinc-400">
          Bring up to 500 films from Movie Fan or Letterboxd. Review every match
          before saving. Films already in your library keep their ratings and
          diary entries.
        </p>
        <details className="mb-4 text-sm text-zinc-400">
          <summary className="cursor-pointer text-pink-300">
            Supported formats & how films are saved
          </summary>
          <p className="mt-2">
            Title/Name is required. Optional: Year, tmdbID, Rating (1–5),
            Rating10 (2–10), WatchedDate/Watched Date. Whole stars only.
          </p>
          <p className="mt-2">
            Dated viewings become private diary entries. Films with a date or
            rating go to Watched; others go to Watchlist. Repeated films use the
            first included row, with one viewing per new film. Rewatch history,
            favorites, reviews, and lists are not imported.
          </p>
        </details>
        {!rows.length && (
          <label className="field-label">
            Choose a CSV
            <input
              className="field"
              type="file"
              accept=".csv,text/csv"
              disabled={busy}
              onChange={(e) => void load(e.target.files?.[0])}
            />
          </label>
        )}
        {error && (
          <p role="alert" className="mt-3 text-pink-300">
            {error}
          </p>
        )}
        <p role="status" className="my-3 text-sm text-pink-300">
          {progress}
        </p>
        {!!rows.length && (
          <>
            <p className="mb-3 font-semibold">
              {count} ready · {unresolved} need a match or skip
            </p>
            <div className="max-h-80 space-y-3 overflow-auto">
              {rows.map((row, i) => (
                <div key={i} className="surface p-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      aria-label={`Include ${row.title}`}
                      checked={!row.skip}
                      disabled={busy || !!row.result}
                      onChange={(e) =>
                        setRows((r) =>
                          r.map((v, j) =>
                            j === i ? { ...v, skip: !e.target.checked } : v
                          )
                        )
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {row.title} {row.year}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {row.rating ? `${row.rating} stars · ` : ''}
                        {row.watchedDate ||
                          (row.rating ? 'Watched · date unknown' : 'Watchlist')}
                      </p>
                      <p className="mt-1 text-sm">
                        {row.result ||
                          (row.skip
                            ? 'Skipped'
                            : !row.movieId
                              ? 'Needs a match'
                              : !eligible[i]
                                ? 'Duplicate — will be skipped'
                                : row.match || `TMDB ${row.movieId}`)}
                      </p>
                    </div>
                  </div>
                  {!row.result && (
                    <button
                      className="mt-2 text-sm text-pink-300"
                      disabled={busy}
                      onClick={() => setResolve(resolve === i ? null : i)}
                    >
                      Choose a different match
                    </button>
                  )}
                  {resolve === i && !busy && (
                    <MovieFinder
                      key={i}
                      initialQuery={row.title}
                      onChoose={(m) => {
                        setRows((r) =>
                          r.map((v, j) =>
                            j === i
                              ? {
                                  ...v,
                                  movieId: m.emsVersionId,
                                  match: `${m.name} (${m.releaseDate?.slice(0, 4) || 'year unknown'})`,
                                }
                              : v
                          )
                        )
                        setResolve(null)
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            <button
              className="btn-brand mt-4"
              disabled={busy || !count || unresolved > 0}
              onClick={() => void commit()}
            >
              Import {count} {count === 1 ? 'film' : 'films'}
            </button>
          </>
        )}
        {busy ? (
          <button
            className="btn-ghost mt-4"
            onClick={() => {
              cancelled.current = true
            }}
          >
            Stop after current film
          </button>
        ) : (
          <button
            className="btn-ghost ml-2 mt-4"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        )}
      </Dialog>
    </>
  )
}
