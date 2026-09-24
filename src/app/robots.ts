import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/server/siteUrl'

// AI training/answer-engine crawlers walk the movie graph aggressively and
// bring no visitors to a fan site, but every page they fetch is a metered
// edge request (and often a function render). Well-behaved ones honor this;
// pair it with the Vercel Firewall "AI Bots" managed rule for the rest.
const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'CCBot',
  'Google-Extended',
  'Applebot-Extended',
  'Bytespider',
  'Amazonbot',
  'meta-externalagent',
  'FacebookBot',
  'PerplexityBot',
  'cohere-ai',
  'Diffbot',
  'ImagesiftBot',
  'Omgilibot',
  'Timpibot',
]

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl()
  return {
    rules: [
      { userAgent: AI_CRAWLERS, disallow: '/' },
      {
        userAgent: '*',
        allow: '/',
        // Auth and API surfaces aren't useful to crawlers. /person/ and /u/ are
        // blocked deliberately: every movie page links to dozens of person pages
        // (each a unique URL that misses the ISR cache), so an obedient crawler
        // walking that graph burns tens of thousands of function invocations a
        // day for thin, TMDB-sourced content. Movie and genre pages remain
        // indexable — they're the content that matters.
        disallow: [
          '/api/',
          '/profile',
          '/signin',
          '/person/',
          '/u/',
          '/lists/',
          '/diary',
          '/year',
          '/library',
          '/circle',
          '/tonight',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
