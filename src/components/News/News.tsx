import type { NewsStoryProps } from './types'
import type { FC } from 'react'
import type { NewStory } from '@/types/main'

import Image from 'next/image'
import parse from 'html-react-parser'
import Balancer from 'react-wrap-balancer'

const News: FC<NewsStoryProps> = ({ newsStories }) => {
  if (!newsStories) return null

  const news = newsStories.filter(
    (story) => !story.title.toLowerCase()?.includes('tv' || 'television')
  )
  const { mainImage } = news.find((story) => story.mainImage.url)

  return (
    <section className="w-full pl-8 text-white">
      <>
        <h2 className="mb-4 w-fit self-start text-xl md:text-5xl">News</h2>
        <div className="space-between flex w-full flex-col-reverse lg:flex-row">
          <div className="flex flex-col lg:ml-12 lg:w-1/2">
            {news.slice(0, 10).map((story: NewStory) => {
              return (
                <a
                  className="py-2"
                  key={story.id}
                  href={story.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Balancer className="text-blue">
                    {parse(story.title)}
                  </Balancer>
                </a>
              )
            })}
          </div>
          {mainImage?.url && (
            <div className="w-full pr-8 pb-4 lg:w-1/2">
              <Image
                src={mainImage?.url}
                width={800}
                height={900}
                priority
                alt="news story"
              />
            </div>
          )}
        </div>
      </>
    </section>
  )
}

export default News
