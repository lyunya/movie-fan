import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/server/siteUrl'

// Movie pages are disallowed in robots.ts (the unbounded movie graph was the
// main driver of blowing the Vercel Hobby quotas), so the sitemap lists only
// the home page. Genre pages stay crawlable through internal links.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: getSiteUrl(),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}
