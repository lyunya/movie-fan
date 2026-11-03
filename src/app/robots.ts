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
        // Auth and API surfaces aren't useful to crawlers. /movie/, /person/ and
        // /u/ are blocked deliberately: every movie page links to ~20 similar
        // movies and dozens of people, so the graph is effectively unbounded
        // (all of TMDB). /movie/[id] renders per request, so each crawled id is
        // a function invocation, Fast Origin Transfer, and Data Cache writes
        // (billed as ISR writes). Crawling it exhausted the Hobby quotas in July,
        // October, and November 2026. Home and genre pages remain indexable.
        disallow: [
          '/api/',
          '/movie/',
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
