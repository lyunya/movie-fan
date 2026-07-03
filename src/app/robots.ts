import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/server/siteUrl'

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl()
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Auth and API surfaces aren't useful to crawlers
      disallow: ['/api/', '/profile', '/signin'],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
