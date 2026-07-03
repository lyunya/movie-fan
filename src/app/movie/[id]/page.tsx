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
  return <MovieDetails id={id} movie={movie} />
}
