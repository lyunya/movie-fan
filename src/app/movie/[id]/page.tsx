import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { catalog } from '@/server/catalog'
import MovieDetails from '@/components/MovieDetails/MovieDetails'
import { filmImage, filmScore } from '@/utils/film'

// Render the unbounded film catalogue on request instead of persisting a full
// ISR page for every id a crawler visits. Catalog fetches still use their own
// Data Cache lifetimes; connection() does not disable those explicit caches.

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  await connection()
  const { id } = await params
  const film = await catalog.filmDetail(id).catch(() => null)
  if (!film) return { title: 'Movie not found' }

  const image = filmImage(film.posterPath, 'w500')
  return {
    title: film.title,
    description: film.overview ?? undefined,
    openGraph: {
      title: film.title,
      description: film.overview ?? undefined,
      images: image ? [image] : undefined,
    },
  }
}

export default async function MoviePage({ params }: PageProps) {
  await connection()
  const { id } = await params
  const film = await catalog.filmDetail(id)
  if (!film) notFound()

  const score = filmScore(film)
  const image = filmImage(film.posterPath, 'w500')
  // Schema.org Movie markup so search engines can render a rich result
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: film.title,
    ...(image ? { image } : {}),
    ...(film.overview ? { description: film.overview } : {}),
    ...(film.releaseDate ? { datePublished: film.releaseDate } : {}),
    ...(film.genres.length
      ? { genre: film.genres.map((genre) => genre.name) }
      : {}),
    ...(film.directors.length
      ? {
          director: film.directors.map((d) => ({
            '@type': 'Person',
            name: d.name,
          })),
        }
      : {}),
    // Only advertise a rating people actually gave (never a placeholder 0%)
    ...(score.kind !== 'none' && score.count
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue:
              score.kind === 'imdb'
                ? film.imdb?.rating
                : film.tmdb.average?.toFixed(1),
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
      <MovieDetails film={film} />
    </>
  )
}
