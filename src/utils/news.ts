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
