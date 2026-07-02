import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { fetchDetails } from '@/server/flixster'
import MovieDetails from '@/components/MovieDetails/MovieDetails'

export const revalidate = 3600

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  const movie = await fetchDetails(id).catch(() => null)
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
  const movie = await fetchDetails(id).catch(() => null)
  if (!movie) notFound()
  return <MovieDetails id={id} movie={movie} />
}
