import type { NewsStoryProps } from './types'
import type { FC } from 'react'
import type { NewStory } from '@/types/main'

import Image from 'next/image'
import parse from 'html-react-parser'
import Balancer from 'react-wrap-balancer'

const News: FC<NewsStoryProps> = ({ newsStories }) => {
  if (!newsStories) return null

  let news = newsStories.filter(
    (story) => !story.title.toLowerCase()?.includes('tv' || 'television')
  )
  const mainStory = news.find((story) => story.mainImage.url)
  news = news.filter((story) => mainStory.id !== story.id)

  return (
    <section className="mx-auto text-white w-11/12 md:w-full md:pl-8">
      <>
        <h2 className="mb-4 self-start text-3xl md:text-5xl">News</h2>
        <div className="sm:w-11/12 space-between grid grid-cols-1 xl:grid-cols-2">
          {mainStory?.mainImage.url && (
            <div className="col-span-full flex text-center xl:col-start-2">
              <a href={mainStory.link} target="_blank" rel="noreferrer">
                <Image
                  src={mainStory?.mainImage.url}
                  height={1200}
                  width={1200}
                  priority
                  alt="news story"
                />
                <Balancer className="my-4 text-center text-2xl lg:text-3xl">
                  {parse( mainStory.title )}
                </Balancer>
              </a>
            </div>
          )}
          <div className="col-span-full	flex flex-col mx-1 xl:ml-12 xl:col-end-2 xl:row-start-1 w-fit">
            {news.slice(0, 10).map((story: NewStory) => {
              return (
                <Balancer key={story.id} className='my-2'>
                  <a
                    className="text-lg lg:text-xl hover:text-blue-400"
                    href={story.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {parse(story.title)}
                  </a>
                </Balancer>
              )
            })}
          </div>
        </div>
      </>
    </section>
  )
}

export default News
