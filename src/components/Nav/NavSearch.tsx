'use client'

import { useEffect, useRef, useState } from 'react'
import type { FC, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { HiOutlineSearch, HiX } from 'react-icons/hi'
import { saveRecentSearch } from '@/components/Search/Search'

/**
 * Global search entry point that lives in the Nav on every page. Collapsed to
 * an icon by default; expands to an inline input on desktop and a full-width
 * bar below the nav on mobile. Submitting routes to the home page's `?q=`
 * deep link, which drives the existing results UI.
 *
 * The "/" shortcut (from the home Search box) is handled here too, so it works
 * on pages that don't render the big search box.
 */
const NavSearch: FC = () => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // "/" anywhere on the page opens + focuses search (like GitHub/YouTube).
  // The home page's own Search box also listens for "/"; whichever input is
  // present grabs focus. Guard against typing in a field.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable)
        return
      // Let the home page's larger search box win when it's on screen
      if (document.getElementById('search')) return
      e.preventDefault()
      setOpen(true)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) {
      inputRef.current?.focus()
      return
    }
    saveRecentSearch(trimmed)
    router.push(`/?q=${encodeURIComponent(trimmed)}`)
    setOpen(false)
    setValue('')
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Search movies"
        className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
      >
        <HiOutlineSearch className="h-5 w-5" />
      </button>
    )
  }

  return (
    <>
      {/* Desktop: inline expanding input */}
      <form
        onSubmit={submit}
        className="relative hidden items-center sm:flex"
        role="search"
      >
        <HiOutlineSearch className="pointer-events-none absolute left-3 h-5 w-5 text-zinc-400" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => !value && setOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          placeholder="Search movies"
          aria-label="Search movies"
          type="search"
          autoComplete="off"
          className="w-52 rounded-full border border-zinc-700 bg-zinc-900/80 py-2 pl-10 pr-9 text-white placeholder-zinc-500 outline-none transition focus:w-64 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/40"
        />
        <button
          type="button"
          onClick={() => {
            setValue('')
            setOpen(false)
          }}
          aria-label="Close search"
          className="absolute right-2 text-zinc-400 transition hover:text-white"
        >
          <HiX className="h-5 w-5" />
        </button>
      </form>

      {/* Mobile: icon stays, full-width bar drops below the nav */}
      <button
        onClick={() => setOpen(false)}
        aria-label="Close search"
        className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 transition hover:bg-zinc-800 hover:text-white sm:hidden"
      >
        <HiX className="h-5 w-5" />
      </button>
      <form
        onSubmit={submit}
        role="search"
        className="absolute inset-x-0 top-full border-b border-zinc-800/80 bg-black/90 p-3 backdrop-blur-md sm:hidden"
      >
        <div className="relative">
          <HiOutlineSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            placeholder="Search movies"
            aria-label="Search movies"
            type="search"
            autoComplete="off"
            className="w-full rounded-full border border-zinc-700 bg-zinc-900/80 py-3 pl-12 pr-4 text-white placeholder-zinc-500 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/40"
          />
        </div>
      </form>
    </>
  )
}

export default NavSearch
