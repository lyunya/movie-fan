'use client'
import Link from 'next/link'
export default function MovieError({ reset }: { reset: () => void }) {
  return (
    <main className="page-shell max-w-xl py-20 text-center">
      <h1 className="text-3xl font-bold">The film details couldn’t load.</h1>
      <p className="mt-4 text-zinc-400">
        Our movie source may be temporarily unavailable. Your library is still
        safe.
      </p>
      <button className="btn-brand mt-6" onClick={reset}>
        Try again
      </button>
      <Link className="mt-4 block text-pink-300" href="/library">
        Go to your library
      </Link>
    </main>
  )
}
