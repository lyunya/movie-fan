import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import ReviewText from '@/components/ui/ReviewText'
import ProfileActions from '@/components/ui/ProfileActions'
import { getPublicProfile } from '@/server/publicProfile'
import MovieGrid from '@/components/MovieGrid/MovieGrid'
import MovieCard from '@/components/MovieCard/MovieCard'
import { filmFromSnapshot } from '@/utils/film'

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
    // Shared-by-link user content; also disallowed in robots.txt. force-dynamic
    // means every crawler hit is an uncached function + DB query.
    robots: { index: false },
  }
}

export default async function PublicWatchlistPage({ params }: PageProps) {
  const { id } = await params
  const profile = await getPublicProfile(id).catch(() => null)
  if (!profile) notFound()

  const { user, movies, entries, lists } = profile
  const owner = user.name || 'A movie fan'
  const rated = movies.filter((movie) => movie.userRating)
  const watchList = movies.filter((movie) => movie.inWatchlist)

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
        <h1 className="text-3xl font-semibold sm:text-4xl">
          <span className="gradient-text">{owner}</span>&apos;s film club
        </h1>
        <p className="text-sm text-zinc-400">
          {watchList.length} to watch · {rated.length} rated
        </p>
        <ProfileActions userId={user.id} />
      </div>

      {user.bio && (
        <p className="mx-auto mb-6 max-w-2xl text-center text-zinc-300">
          {user.bio}
        </p>
      )}
      {!!lists.length && (
        <section className="mb-8">
          <h2 className="section-heading mb-4">Shared lists</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {lists.map((l) => (
              <Link
                prefetch={false}
                key={l.id}
                className="surface p-4"
                href={`/lists/${l.id}`}
              >
                {l.ranked ? '# ' : ''}
                {l.name}
                <span className="mt-1 block text-xs text-zinc-400">
                  {l._count.items} films
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
      {!!entries.length && (
        <section className="mb-10">
          <h2 className="section-heading mb-4">Shared movie nights</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {entries.map((e) => (
              <article key={e.id} className="surface p-5">
                <Link
                  prefetch={false}
                  className="text-lg font-semibold"
                  href={`/movie/${e.movieId}`}
                >
                  {e.name}
                </Link>
                <p className="mt-2 text-xs text-zinc-400">
                  {e.watchedAt.toLocaleDateString()}{' '}
                  {e.rating ? `· ${e.rating}★` : ''}
                </p>
                {e.review && <ReviewText text={e.review} spoiler={e.spoiler} />}
              </article>
            ))}
          </div>
        </section>
      )}
      <h2 className="section-heading mb-4">The collection</h2>
      {movies.length === 0 ? (
        <p className="py-16 text-center text-xl text-zinc-300">
          This watchlist is empty.
        </p>
      ) : (
        <MovieGrid
          movieCards={movies.map((movie) => (
            <MovieCard
              key={movie.id}
              film={filmFromSnapshot(movie)}
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
