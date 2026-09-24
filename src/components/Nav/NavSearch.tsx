'use client'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { HiOutlineSearch } from 'react-icons/hi'
import Dialog from '@/components/ui/Dialog'
export default function NavSearch() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
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
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    router.push(`/?q=${encodeURIComponent(value.trim())}`)
    setOpen(false)
  }
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex min-h-11 items-center gap-3 rounded-full border border-zinc-700 px-3 text-sm text-zinc-300 sm:min-w-40"
        aria-label="Search movies and people"
      >
        <HiOutlineSearch className="h-5 w-5" />
        <span className="hidden sm:inline">Search films…</span>
        <kbd className="ml-auto hidden text-zinc-400 sm:inline">/</kbd>
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Find your next favorite"
      >
        <form onSubmit={submit} role="search" className="space-y-4">
          <label className="field-label">
            Movie or person
            <input
              ref={input}
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="field"
              placeholder="Arrival, Amy Adams…"
              type="search"
            />
          </label>
          <button className="btn-brand w-full">Search</button>
        </form>
      </Dialog>
    </>
  )
}
