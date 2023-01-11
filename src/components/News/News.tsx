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
      <h2 className='text-xl md:text-5xl self-start mb-4'>News</h2>
      {news.slice(0, 10).map((story: NewStory) => {
       return <a className='py-6' key={story.id} href={story.link} target="_blank" rel="noreferrer" >
         <Balancer className='text-blue w-11/12 my-2'>{parse(story.title)}</Balancer>
        </a>
      })}
        </>
    </section>
  )
}

export default News