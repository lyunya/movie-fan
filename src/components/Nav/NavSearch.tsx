'use client'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { keepPreviousData } from '@tanstack/react-query'
import { HiOutlineSearch } from 'react-icons/hi'
import Dialog from '@/components/ui/Dialog'
import { api } from '@/utils/api'
import { toSlug } from '@/utils/slug'
import { tmdbImage } from '@/utils/tmdbImage'

type Suggestion = {
  key: string
  href: string
  title: string
  detail: string
  image: string | null
  round?: boolean
}

/**
 * Command-palette search: "/" (or the search button) opens it, results appear
 * as you type, arrow keys move, Enter opens. Queries are debounced and
 * cached, so typing a title costs one or two requests, not one per key.
 */
export default function NavSearch() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [term, setTerm] = useState('')
  const [active, setActive] = useState(-1)
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (
        e.key !== '/' ||
        e.metaKey ||
        e.ctrlKey ||
        /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName) ||
        (e.target as HTMLElement).isContentEditable
      )
        return
      e.preventDefault()
      setOpen(true)
    }
    const show = () => setOpen(true)
    window.addEventListener('keydown', listener)
    window.addEventListener('movie-fan-search', show)
    return () => {
      window.removeEventListener('keydown', listener)
      window.removeEventListener('movie-fan-search', show)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setTerm(value.trim()), 250)
    return () => clearTimeout(t)
  }, [value])

  const results = api.tmdb.search.useQuery(
    { query: term, page: 1 },
    {
      enabled: open && term.length >= 2,
      placeholderData: keepPreviousData,
      staleTime: 5 * 60_000,
      retry: 0,
    }
  )

  const suggestions: Suggestion[] =
    term.length >= 2 && results.data
      ? [
          ...results.data.movies.slice(0, 6).map((m) => ({
            key: `m-${m.emsVersionId}`,
            href: `/movie/${m.emsVersionId}`,
            title: m.name,
            detail: m.releaseDate?.slice(0, 4) || 'Film',
            image: tmdbImage(m.posterImage?.url || null, 'w92'),
          })),
          ...results.data.people.slice(0, 3).map((p) => ({
            key: `p-${p.id}`,
            href: `/person/${toSlug(p.id, p.name)}`,
            title: p.name,
            detail: p.knownFor ? `Known for ${p.knownFor}` : 'Person',
            image: tmdbImage(p.profileUrl, 'w92'),
            round: true,
          })),
        ]
      : []

  useEffect(() => setActive(-1), [term])

  const close = () => {
    setOpen(false)
    setValue('')
    setTerm('')
  }
  const go = (href: string) => {
    router.push(href)
    close()
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const picked = suggestions[active]
    if (picked) return go(picked.href)
    if (!value.trim()) return
    go(`/?q=${encodeURIComponent(value.trim())}`)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex min-h-11 items-center gap-3 rounded-full border border-zinc-700 px-3 text-sm text-zinc-300 transition hover:border-zinc-500 sm:min-w-40"
        aria-label="Search movies and people"
      >
        <HiOutlineSearch className="h-5 w-5" />
        <span className="hidden sm:inline">Search films…</span>
        <kbd className="ml-auto hidden rounded border border-zinc-700 px-1.5 text-xs text-zinc-400 sm:inline">
          /
        </kbd>
      </button>
      <Dialog
        open={open}
        onClose={close}
        title="Find your next favorite"
        contentScroll
      >
        <form
          onSubmit={submit}
          role="search"
          className="flex min-h-0 flex-1 flex-col gap-3 pt-1.5"
        >
          <label className="field-label">
            <span className="sr-only">Movie or person</span>
            <input
              ref={input}
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setActive((i) => Math.min(i + 1, suggestions.length - 1))
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setActive((i) => Math.max(i - 1, -1))
                }
              }}
              className="field"
              placeholder="Arrival, Amy Adams…"
              type="search"
              role="combobox"
              aria-expanded={suggestions.length > 0}
              aria-controls="search-suggestions"
              aria-autocomplete="list"
              aria-activedescendant={
                active >= 0 ? `sugg-${suggestions[active]?.key}` : undefined
              }
            />
          </label>
          {suggestions.length > 0 && (
            <ul
              id="search-suggestions"
              role="listbox"
              aria-label="Suggestions"
              className="-mx-2 min-h-0 flex-1 overflow-y-auto overscroll-contain"
            >
              {suggestions.map((s, i) => (
                <li
                  key={s.key}
                  id={`sugg-${s.key}`}
                  role="option"
                  aria-selected={i === active}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(s.href)}
                    className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition ${i === active ? 'bg-zinc-800' : ''}`}
                  >
                    <span
                      className={`relative h-14 w-10 shrink-0 overflow-hidden bg-zinc-800 ${s.round ? 'h-10 rounded-full' : 'rounded-md'}`}
                    >
                      {s.image && (
                        <Image
                          src={s.image}
                          fill
                          sizes="40px"
                          alt=""
                          className="object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {s.title}
                      </span>
                      <span className="block truncate text-sm text-zinc-400">
                        {s.detail}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {term.length >= 2 &&
            results.isFetched &&
            !results.isFetching &&
            suggestions.length === 0 && (
              <p className="text-sm text-zinc-400">
                {results.isError
                  ? 'Search is unavailable right now. Press Enter to try the full search.'
                  : `Nothing matched “${term}”.`}
              </p>
            )}
          <button className="btn-brand w-full shrink-0">
            {value.trim() ? `See all results for “${value.trim()}”` : 'Search'}
          </button>
          <p className="hidden text-center text-xs text-zinc-500 sm:block">
            ↑ ↓ to move · Enter to open · Esc to close
          </p>
        </form>
      </Dialog>
    </>
  )
}
