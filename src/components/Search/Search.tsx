'use client'

import { useEffect, useRef, useState } from 'react'
import type { FC } from 'react'
import type { SearchProps } from './types'
import { HiOutlineSearch, HiX, HiOutlineClock } from 'react-icons/hi'
import { CgSpinner } from 'react-icons/cg'

export const RECENT_SEARCHES_KEY = 'movie-fan-recent-searches'
const MAX_RECENTS = 6

export const readRecentSearches = (): string[] => {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : []
  } catch {
    return []
  }
}

export const saveRecentSearch = (query: string) => {
  const next = [
    query,
    ...readRecentSearches().filter(
      (item) => item.toLowerCase() !== query.toLowerCase()
    ),
  ].slice(0, MAX_RECENTS)
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
  } catch {
    /* storage full or blocked — recents are a nice-to-have */
  }
}

const Search: FC<SearchProps> = ({ value, loading, onQueryChange }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const [recents, setRecents] = useState<string[]>([])

  // "/" anywhere on the page jumps to search (like GitHub/YouTube)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable)
        return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const clear = () => {
    onQueryChange('')
    inputRef.current?.focus()
  }

  const showRecents = focused && value === '' && recents.length > 0

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
        <HiOutlineSearch className="h-5 w-5" />
      </span>
      <label className="sr-only" htmlFor="search">
        Search for movies
      </label>
      <input
        ref={inputRef}
        className="w-full rounded-full border border-zinc-700 bg-zinc-900/80 py-3 pl-12 pr-16 text-lg text-white placeholder-zinc-500 shadow-lg outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/40"
        value={value}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={() => {
          setRecents(readRecentSearches())
          setFocused(true)
        }}
        onBlur={() => setFocused(false)}
        id="search"
        placeholder="Search for movies"
        type="search"
        autoComplete="off"
      />
      <span className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
        {loading ? (
          <CgSpinner className="h-5 w-5 animate-spin text-pink-500" />
        ) : value ? (
          <button
            onClick={clear}
            aria-label="Clear search"
            className="text-zinc-400 transition hover:text-white"
          >
            <HiX className="h-5 w-5" />
          </button>
        ) : (
          <kbd className="hidden rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400 sm:block">
            /
          </kbd>
        )}
      </span>

      {/* Recent searches — shown on focus while the box is empty */}
      {showRecents && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/95 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between px-4 pb-1 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Recent searches
            </p>
            <button
              // mousedown so it wins the race against the input's blur
              onMouseDown={(e) => {
                e.preventDefault()
                localStorage.removeItem(RECENT_SEARCHES_KEY)
                setRecents([])
              }}
              className="text-xs text-zinc-500 transition hover:text-pink-400"
            >
              Clear
            </button>
          </div>
          <ul className="pb-2">
            {recents.map((recent) => (
              <li key={recent}>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onQueryChange(recent)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-zinc-200 transition hover:bg-zinc-800/80 hover:text-pink-400"
                >
                  <HiOutlineClock className="h-4 w-4 shrink-0 text-zinc-500" />
                  <span className="truncate">{recent}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default Search
