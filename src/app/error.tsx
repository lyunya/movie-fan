'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex max-w-screen-md flex-1 flex-col items-center justify-center px-4 py-24 text-center text-white sm:px-8">
      <h1 className="font-heading text-3xl font-bold sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-4 text-zinc-400">
        An unexpected error occurred. You can try again, or head back home.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button className="btn-brand" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="btn-ghost">
          Back to home
        </Link>
      </div>
    </main>
  )
}
