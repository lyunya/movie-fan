import type { NewsStoryProps } from './types'
import type { FC } from "react"
import type { NewStory } from '@/types/main';

const News: FC<NewsStoryProps> = ({ newsStories }) => {
  // if (!newsStories) return null

  return (
    <section className='text-white pl-8'>
      <>
      <h2 className='text-xl md:text-5xl self-start'>News</h2>
      {newsStories.slice(0, 10).map((story: NewStory) => {
        <a key={story.id} href={story.link}>
          <p className='text-blue'>{story.title}</p>
        </a>
      })}
        </>
    </section>
  )
}

export default News