import type { NewsStoryProps } from './types'
import type { FC } from "react"
import type { NewStory } from '@/types/main';

import parse from 'html-react-parser';
import Balancer from 'react-wrap-balancer';


const News: FC<NewsStoryProps> = ({ newsStories }) => {
  if (!newsStories) return null

  const news = newsStories.filter(story => !story.title.toLowerCase()?.includes('tv' || 'television'))

  return (
    <section className='text-white pl-8'>
      <>
      <h2 className='text-xl md:text-5xl self-start mb-4 w-fit'>News</h2>
      <div className='flex flex-col'>
      {news.slice(0, 10).map((story: NewStory) => {
       return <a className='py-2' key={story.id} href={story.link} target="_blank" rel="noreferrer" >
         <Balancer className='text-blue'>{parse(story.title)}</Balancer>
        </a>
      })}
      </div>
        </>
    </section>
  )
}

export default News