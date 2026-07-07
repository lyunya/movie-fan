import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/server/siteUrl'

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl()
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Auth and API surfaces aren't useful to crawlers. /person/ and /u/ are
      // blocked deliberately: every movie page links to dozens of person pages
      // (each a unique URL that misses the ISR cache), so an obedient crawler
      // walking that graph burns tens of thousands of function invocations a
      // day for thin, TMDB-sourced content. Movie and genre pages remain
      // indexable — they're the content that matters.
      disallow: ['/api/', '/profile', '/signin', '/person/', '/u/'],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
