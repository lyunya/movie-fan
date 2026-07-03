import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/server/siteUrl'
import { fetchPopular, fetchNowPlaying, fetchUpcoming } from '@/server/tmdb'

// Refresh alongside the home data windows
export const revalidate = 21600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl()
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1 },
  ]

  // Movie pages are unbounded; listing the currently surfaced titles is enough
  // for crawlers to discover the section and follow internal links from there.
  const [popular, nowPlaying, upcoming] = await Promise.all([
    fetchPopular().catch(() => []),
    fetchNowPlaying().catch(() => []),
    fetchUpcoming().catch(() => []),
  ])

  const seen = new Set<string>()
  const movieRoutes: MetadataRoute.Sitemap = [
    ...popular,
    ...nowPlaying,
    ...upcoming,
  ]
    .filter((movie) => {
      if (!movie.emsVersionId || seen.has(movie.emsVersionId)) return false
      seen.add(movie.emsVersionId)
      return true
    })
    .map((movie) => ({
      url: `${base}/movie/${movie.emsVersionId}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  return [...staticRoutes, ...movieRoutes]
}
