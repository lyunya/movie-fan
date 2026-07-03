import { describe, it, expect } from 'vitest'
import type { NewStory } from '@/types/main'
import { partitionNews } from './news'

const story = (over: Partial<NewStory>): NewStory => ({
  id: '1',
  title: 'A film story',
  mainImage: { url: '' },
  link: 'https://example.com',
  ...over,
})

describe('partitionNews', () => {
  it('drops TV coverage from the list', () => {
    const { stories } = partitionNews([
      story({ id: '1', title: 'A great TV show' }),
      story({ id: '2', title: 'A new film' }),
    ])
    expect(stories.map((s) => s.id)).toEqual(['2'])
  })

  it('picks the first image-bearing story as the main story', () => {
    const { mainStory, restStories } = partitionNews([
      story({ id: '1', title: 'no image', mainImage: { url: '' } }),
      story({ id: '2', title: 'has image', mainImage: { url: 'http://x/i.jpg' } }),
    ])
    expect(mainStory?.id).toBe('2')
    expect(restStories.map((s) => s.id)).toEqual(['1'])
  })

  it('skips images already known to have failed', () => {
    const { mainStory } = partitionNews(
      [
        story({ id: '1', title: 'a', mainImage: { url: 'http://x/bad.jpg' } }),
        story({ id: '2', title: 'b', mainImage: { url: 'http://x/good.jpg' } }),
      ],
      new Set(['http://x/bad.jpg'])
    )
    expect(mainStory?.id).toBe('2')
  })

  it('handles undefined input', () => {
    const { stories, mainStory } = partitionNews(undefined)
    expect(stories).toEqual([])
    expect(mainStory).toBeUndefined()
  })
})
