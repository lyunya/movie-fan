'use client'

import type { NewsStoryProps } from './types'
import type { FC } from 'react'
import type { NewStory } from '@/types/main'

import { useState } from 'react'
import Image from 'next/image'
import parse from 'html-react-parser'
import Balancer from 'react-wrap-balancer'

const INITIAL_STORIES = 8

const News: FC<NewsStoryProps> = ({ newsStories }) => {
  const [expanded, setExpanded] = useState(false)
  // Feed images can 404 or come from a host we can't render — when one
  // fails, fall back to the next story that has a working image
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  const stories = (newsStories || []).filter(
    (story) => !story.title?.toLowerCase().includes('tv')
  )
  const mainStory = stories.find(
    (story) => story.mainImage?.url && !failedImages.has(story.mainImage.url)
  )
  const restStories = stories.filter((story) => story.id !== mainStory?.id)
  const visibleStories = expanded
    ? restStories
    : restStories.slice(0, INITIAL_STORIES)
  const hiddenCount = restStories.length - INITIAL_STORIES

  // Nothing to show (the news feed is sometimes empty) — render nothing
  // rather than a stray heading
  if (stories.length === 0) return null

  return (
    <section className="flex w-full flex-col text-white">
      <h2 className="section-heading mb-4">
        <span className="gradient-text">News</span>
      </h2>
      <div className="flex flex-1 flex-col gap-6">
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
                onError={() =>
                  setFailedImages(
                    (prev) => new Set(prev).add(mainStory.mainImage.url)
                  )
                }
              />
            </div>
            <Balancer className="block p-4 text-lg font-semibold transition group-hover:text-pink-400 lg:text-xl">
              {parse(mainStory.title)}
            </Balancer>
          </a>
        )}
        <div className="surface flex flex-1 flex-col overflow-hidden">
          <ul className="flex flex-col divide-y divide-zinc-800">
            {visibleStories.map((story: NewStory) => (
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
          {hiddenCount > 0 && (
            <button
              onClick={() => setExpanded((current) => !current)}
              className="border-t border-zinc-800 px-4 py-3 text-sm font-semibold text-pink-400 transition hover:bg-zinc-800/60 hover:text-pink-300"
            >
              {expanded ? 'Show less' : `More news (${hiddenCount})`}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export default News
