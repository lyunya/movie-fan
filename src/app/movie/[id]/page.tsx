import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { fetchMovieDetails } from '@/server/tmdb'
import MovieDetails from '@/components/MovieDetails/MovieDetails'
import { describeScore } from '@/utils/score'

// Movie facts are effectively static — regenerate at most daily
export const revalidate = 86400

// An empty list opts every path into on-demand ISR: the first visit renders
// and caches the page, later visits (and crawlers) are served from the cache
// until `revalidate` elapses. Without this, Next treats the route as fully
// dynamic and every view is a fresh serverless render.
export async function generateStaticParams() {
  return []
}

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  const movie = await fetchMovieDetails(id).catch(() => null)
  if (!movie) return { title: 'Movie not found' }

  const image = movie.posterImage?.url
  return {
    title: movie.name,
    description: movie.synopsis ?? undefined,
    openGraph: {
      title: movie.name,
      description: movie.synopsis ?? undefined,
      images: image ? [image] : undefined,
    },
  }
}

export default async function MoviePage({ params }: PageProps) {
  const { id } = await params
  const movie = await fetchMovieDetails(id)
  if (!movie) notFound()

  const score = describeScore({
    tmdbScore: movie.tomatoMeter,
    tmdbVotes: movie.voteCount,
    imdbRating: movie.imdbRating,
    imdbVotes: movie.imdbVoteCount,
    releaseDate: movie.releaseDate,
  })
  // Schema.org Movie markup so search engines can render a rich result
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.name,
    ...(movie.posterImage?.url ? { image: movie.posterImage.url } : {}),
    ...(movie.synopsis ? { description: movie.synopsis } : {}),
    ...(movie.releaseDate ? { datePublished: movie.releaseDate } : {}),
    ...(movie.genres.length
      ? { genre: movie.genres.map((genre) => genre.name) }
      : {}),
    ...(movie.directedBy
      ? {
          director: movie.directedBy
            .split(',')
            .map((name) => ({ '@type': 'Person', name: name.trim() })),
        }
      : {}),
    // Only advertise a rating people actually gave (never a placeholder 0%)
    ...(score.kind !== 'none' && score.count
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue:
              score.kind === 'imdb'
                ? movie.imdbRating
                : (movie.tomatoMeter! / 10).toFixed(1),
            bestRating: 10,
            worstRating: 0,
            ratingCount: score.count,
          },
        }
      : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <MovieDetails id={id} movie={movie} />
    </>
  )
}
