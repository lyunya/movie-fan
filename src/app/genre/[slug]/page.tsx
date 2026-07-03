import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { fetchGenre, fetchGenreName, isTmdbConfigured } from '@/server/tmdb'
import { parseIdFromSlug } from '@/utils/slug'
import GenreResults from './GenreResults'

// Genre listings shift slowly — rebuild at most every 6h
export const revalidate = 21600

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const genreId = parseIdFromSlug(slug)
  const name = genreId ? await fetchGenreName(genreId).catch(() => null) : null
  if (!name) return { title: 'Genre' }
  return {
    title: `${name} movies`,
    description: `Popular ${name} movies`,
  }
}

export default async function GenrePage({ params }: PageProps) {
  const { slug } = await params
  const genreId = parseIdFromSlug(slug)
  if (!genreId || !isTmdbConfigured()) notFound()

  const [name, firstPage] = await Promise.all([
    fetchGenreName(genreId).catch(() => null),
    fetchGenre(genreId, 1).catch(() => ({ movies: [], page: 1, totalPages: 1 })),
  ])

  if (!name) notFound()

  return (
    <main className="mx-auto max-w-screen-xl px-4 pb-16 pt-8 text-white sm:px-8">
      <h1 className="section-heading mb-8">
        <span className="gradient-text">{name}</span> movies
      </h1>
      <GenreResults
        genreId={genreId}
        initialMovies={firstPage.movies}
        totalPages={firstPage.totalPages}
      />
    </main>
  )
}
