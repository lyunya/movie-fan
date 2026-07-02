'use client'

import { useRef, useState } from 'react'
import type { FC } from 'react'
import type { SearchProps } from './types'
import { HiOutlineSearch, HiX } from 'react-icons/hi'
import { CgSpinner } from 'react-icons/cg'

const Search: FC<SearchProps> = ({ loading, onQueryChange }) => {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (next: string) => {
    setValue(next)
    onQueryChange(next)
  }

  const clear = () => {
    setValue('')
    onQueryChange('')
    inputRef.current?.focus()
  }

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
        className="w-full rounded-full border border-zinc-700 bg-zinc-900/80 py-3 pl-12 pr-12 text-lg text-white placeholder-zinc-500 shadow-lg outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/40"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        id="search"
        placeholder="Search for movies"
        type="search"
        autoComplete="off"
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2">
        {loading ? (
          <CgSpinner className="h-5 w-5 animate-spin text-pink-500" />
        ) : (
          value && (
            <button
              onClick={clear}
              aria-label="Clear search"
              className="text-zinc-400 transition hover:text-white"
            >
              <HiX className="h-5 w-5" />
            </button>
          )
        )}
      </span>
    </div>
  )
}

export default Search
