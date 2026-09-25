/**
 * Movie news via RSS — no API key, no rate limit, no vendor account.
 * Pulls the film feeds from a few entertainment trade outlets, normalizes
 * them into the app's NewStory shape, and merges/sorts/dedupes the result.
 */
import { clusterNews, newsTopic } from '@/utils/news'
import Parser from 'rss-parser'
import type { NewStory } from '@/types/main'

const FEEDS = [
  'https://variety.com/v/film/feed/',
  'https://www.hollywoodreporter.com/c/movies/feed/',
  'https://deadline.com/v/film/feed/',
]

type RssItem = {
  title?: string
  link?: string
  guid?: string
  isoDate?: string
  pubDate?: string
  content?: string
  contentSnippet?: string
  enclosure?: { url?: string }
  mediaContent?: { $?: { url?: string } } | { $?: { url?: string } }[]
  mediaThumbnail?: { $?: { url?: string } }
}

const parser: Parser<Record<string, unknown>, RssItem> = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
    ],
  },
})

const extractImage = (item: RssItem): string | undefined => {
  if (item.enclosure?.url) return item.enclosure.url
  const media = Array.isArray(item.mediaContent)
    ? item.mediaContent[0]
    : item.mediaContent
  if (media?.$?.url) return media.$.url
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url
  // Some feeds only embed the image in the article HTML
  const html = item.content || item.contentSnippet || ''
  return html.match(/<img[^>]+src="([^">]+)"/)?.[1]
}

const fetchFeed = async (url: string) => {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MovieFanBot/1.0)' },
    // News moves fast; refresh more often than the movie data
    next: { revalidate: 1800 },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`RSS feed failed (${res.status}): ${url}`)
  return parser.parseString(await res.text())
}

export const fetchNewsDigest = async () => {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed))

  const stories: (NewStory & { publishedAt: string })[] = []
  for (const result of results) {
    if (result.status !== 'fulfilled') {
      console.error(result.reason)
      continue
    }
    for (const item of result.value.items) {
      if (!item.title || !item.link) continue
      let link: URL
      try {
        link = new URL(item.link)
        if (!['https:', 'http:'].includes(link.protocol)) continue
      } catch {
        continue
      }
      stories.push({
        id: item.guid || item.link,
        title: item.title
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
        source: link.hostname.replace(/^www\./, ''),
        topic: newsTopic(item.title),
        link: item.link,
        mainImage: { url: extractImage(item) || '' },
        publishedAt: Number.isFinite(
          Date.parse(item.isoDate || item.pubDate || '')
        )
          ? new Date(item.isoDate || item.pubDate!).toISOString()
          : '',
      })
    }
  }

  const seen = new Set<string>()
  const clustered = clusterNews(
    stories
      .filter((story) => (seen.has(story.link) ? false : seen.add(story.link)))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, 60)
  ).slice(0, 30)
  return {
    stories: clustered,
    failedSources: results.flatMap((r, i) =>
      r.status === 'rejected'
        ? [new URL(FEEDS[i]!).hostname.replace(/^www\./, '')]
        : []
    ),
  }
}
export const fetchNews = async (): Promise<NewStory[]> =>
  (await fetchNewsDigest()).stories
