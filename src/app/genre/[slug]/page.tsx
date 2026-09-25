import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { catalog, isCatalogConfigured } from '@/server/catalog'
import { parseIdFromSlug } from '@/utils/slug'
import GenreResults from './GenreResults'

// Genre listings shift slowly — rebuild at most every 6h
export const revalidate = 21600

// An empty list opts every path into on-demand ISR: the first visit renders
// and caches the page, later visits (and crawlers) are served from the cache
// until `revalidate` elapses. Without this, Next treats the route as fully
// dynamic and every view is a fresh serverless render.
export async function generateStaticParams() {
  return []
}

type PageProps = { params: Promise<{ slug: string }> }

const genreName = async (id: number) =>
  (await catalog.genres().catch(() => [])).find((g) => g.id === id)?.name ??
  null

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const genreId = parseIdFromSlug(slug)
  const name = genreId ? await genreName(genreId) : null
  if (!name) return { title: 'Genre' }
  return {
    title: `${name} movies`,
    description: `Popular ${name} movies`,
  }
}

export default async function GenrePage({ params }: PageProps) {
  const { slug } = await params
  const genreId = parseIdFromSlug(slug)
  if (!genreId || !isCatalogConfigured()) notFound()

  const [name, firstPage] = await Promise.all([
    genreName(genreId),
    catalog.discover({ genreIds: [genreId] }).catch(() => ({
      films: [],
      page: 1,
      totalPages: 1,
      totalResults: 0,
    })),
  ])

  if (!name) notFound()

  return (
    <main className="mx-auto max-w-screen-xl px-4 pb-16 pt-8 text-white sm:px-8">
      <h1 className="section-heading mb-8">
        <span className="gradient-text">{name}</span> movies
      </h1>
      <GenreResults genreId={genreId} initialPage={firstPage} />
    </main>
  )
}
