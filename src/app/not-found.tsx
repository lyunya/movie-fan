import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-screen-md flex-1 flex-col items-center justify-center px-4 py-24 text-center text-white sm:px-8">
      <p className="gradient-text font-heading text-7xl font-black sm:text-8xl">
        404
      </p>
      <h1 className="mt-4 font-heading text-3xl font-bold sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-4 text-zinc-400">
        We couldn&apos;t find the page you were looking for. It may have moved
        or never existed.
      </p>
      <div className="mt-8">
        <Link href="/" className="btn-brand">
          Back to home
        </Link>
      </div>
    </main>
  )
}
