import type { NewsStoryProps } from './types'
import type { FC } from 'react'
import type { NewStory } from '@/types/main'

import Image from 'next/image'
import parse from 'html-react-parser'
import Balancer from 'react-wrap-balancer'

const News: FC<NewsStoryProps> = ({ newsStories }) => {
  const stories = (newsStories || []).filter(
    (story) => !story.title?.toLowerCase().includes('tv')
  )
  const mainStory = stories.find((story) => story.mainImage?.url)
  const restStories = stories
    .filter((story) => story.id !== mainStory?.id)
    .slice(0, 8)

  // Nothing to show (the news feed is sometimes empty) — render nothing
  // rather than a stray heading
  if (stories.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-screen-xl px-4 py-6 text-white sm:px-8">
      <h2 className="section-heading mb-4">
        <span className="gradient-text">News</span>
      </h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {mainStory?.mainImage?.url && (
          <a
            href={mainStory.link}
            target="_blank"
            rel="noreferrer"
            className="surface group block overflow-hidden"
          >
            <div className="relative aspect-video w-full overflow-hidden">
              <Image
                src={mainStory.mainImage.url}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 600px"
                alt="Featured news story"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            </div>
            <Balancer className="block p-4 text-lg font-semibold transition group-hover:text-pink-400 lg:text-xl">
              {parse(mainStory.title)}
            </Balancer>
          </a>
        )}
        <ul className="surface flex flex-col divide-y divide-zinc-800">
          {restStories.map((story: NewStory) => (
            <li key={story.id}>
              <a
                className="block px-4 py-3 text-base transition hover:bg-zinc-800/60 hover:text-pink-400 lg:text-lg"
                href={story.link}
                target="_blank"
                rel="noreferrer"
              >
                <Balancer>{parse(story.title)}</Balancer>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default News
