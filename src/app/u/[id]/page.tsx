import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getPublicProfile } from '@/server/publicProfile'
import MovieGrid from '@/components/MovieGrid/MovieGrid'
import MovieCard from '@/components/MovieCard/MovieCard'

// Public pages read live opt-in state — don't cache across users
export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  const profile = await getPublicProfile(id).catch(() => null)
  if (!profile) return { title: 'Watchlist' }
  const owner = profile.user.name || 'A movie fan'
  return {
    title: `${owner}'s watchlist`,
    description: `${owner}'s movie watchlist on Movie Fan`,
  }
}

export default async function PublicWatchlistPage({ params }: PageProps) {
  const { id } = await params
  const profile = await getPublicProfile(id).catch(() => null)
  if (!profile) notFound()

  const { user, movies } = profile
  const owner = user.name || 'A movie fan'
  const rated = movies.filter((movie) => movie.userRating)
  const watchList = movies.filter((movie) => !movie.userRating)

  return (
    <main className="mx-auto w-11/12 max-w-screen-xl pb-16 text-white">
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-zinc-700">
          <Image
            src={user.image || '/avatar.png'}
            fill
            sizes="80px"
            alt={`${owner} avatar`}
            className="object-cover"
          />
        </div>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">
          <span className="gradient-text">{owner}</span>&apos;s watchlist
        </h1>
        <p className="text-sm text-zinc-400">
          {watchList.length} to watch · {rated.length} rated
        </p>
      </div>

      {movies.length === 0 ? (
        <p className="py-16 text-center text-xl text-zinc-300">
          This watchlist is empty.
        </p>
      ) : (
        <MovieGrid
          movieCards={movies.map((movie) => (
            <MovieCard
              key={movie.id}
              name={movie.name}
              emsVersionId={movie.emsVersionId}
              posterImage={movie.posterImage}
              releaseDate={movie.releaseDate}
              tomatoMeter={movie.tomatoMeter}
              userRating={movie.userRating}
            />
          ))}
        />
      )}

      <div className="mt-12 text-center">
        <Link href="/" className="btn-ghost">
          Explore Movie Fan
        </Link>
      </div>
    </main>
  )
}
