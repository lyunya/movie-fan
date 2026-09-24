import Link from 'next/link'
import type { NewsStoryProps } from './types'
export default function News({ newsStories }: NewsStoryProps) {
  return (
    <section className="surface p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="eyebrow">The latest reel</h2>
        <Link href="/news" className="text-sm text-pink-300">
          All news ↗
        </Link>
      </div>
      {newsStories.slice(0, 3).map((story) => (
        <article
          key={story.id}
          className="border-b border-zinc-800 py-4 last:border-0"
        >
          <p className="mb-1 text-xs text-zinc-400">
            {story.source || 'Film news'}
            {story.publishedAt
              ? ` · ${new Date(story.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`
              : ''}
          </p>
          <a
            href={story.link}
            target="_blank"
            rel="noreferrer"
            className="font-semibold leading-snug hover:text-pink-300"
          >
            {story.title}
            <span className="sr-only"> (opens publisher in new tab)</span>
          </a>
        </article>
      ))}
      {!newsStories.length && (
        <p className="mt-5 text-zinc-400">
          The latest stories couldn’t be loaded. Check back shortly.
        </p>
      )}
    </section>
  )
}
