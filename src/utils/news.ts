import type { NewStory } from '@/types/main'

// How many headlines the News card shows before its own "More news" toggle
// (mobile) — and, on desktop, before the overflow spills into the leftover
// space beside the hero (see HomeClient's headline-fill panel). Keeping this
// in one place keeps the two split points in sync.
export const INITIAL_HEADLINES = 8

/**
 * Filters out TV coverage and picks the featured (image-bearing) story.
 * Shared by News and HomeClient so both compute the same rest-of-list
 * ordering when splitting headlines across the two-column layout.
 */
export const partitionNews = (
  newsStories: NewStory[] | undefined,
  failedImageUrls: Set<string> = new Set()
) => {
  const stories = (newsStories || []).filter(
    (story) => !story.title?.toLowerCase().includes('tv')
  )
  const mainStory = stories.find(
    (story) => story.mainImage?.url && !failedImageUrls.has(story.mainImage.url)
  )
  const restStories = stories.filter((story) => story.id !== mainStory?.id)
  return { stories, mainStory, restStories }
}

export function newsTopic(title: string) {
  if (/trailer|teaser/i.test(title)) return 'Trailers'
  if (/oscar|festival|cannes|venice|award/i.test(title))
    return 'Festivals & awards'
  if (/release|streaming|box office|preview/i.test(title)) return 'Releases'
  return 'Industry'
}
/** Conservative shared-phrase clustering; never merge merely for sharing a film title. */
export function clusterNews(stories: NewStory[]): NewStory[] {
  const groups: NewStory[] = []
  const tokens = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3)
    )
  for (const story of stories) {
    const words = tokens(story.title)
    const group = groups.find((g) => {
      const other = tokens(g.title)
      const overlap = [...words].filter((w) => other.has(w)).length
      return overlap >= 5 && overlap / Math.max(words.size, other.size) >= 0.58
    })
    if (group)
      group.coverage = [
        ...(group.coverage || []),
        { title: story.title, link: story.link, source: story.source },
      ]
    else groups.push({ ...story, coverage: [] })
  }
  return groups
}
