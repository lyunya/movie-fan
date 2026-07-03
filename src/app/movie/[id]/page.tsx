import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { fetchMovieDetails } from '@/server/tmdb'
import MovieDetails from '@/components/MovieDetails/MovieDetails'

// Movie facts are effectively static — regenerate at most daily
export const revalidate = 86400

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
  const movie = await fetchMovieDetails(id).catch(() => null)
  if (!movie) notFound()

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
    ...(movie.tomatoMeter != null && movie.voteCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: (movie.tomatoMeter / 10).toFixed(1),
            bestRating: 10,
            worstRating: 0,
            ratingCount: movie.voteCount,
          },
        }
      : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MovieDetails id={id} movie={movie} />
    </>
  )
}
