'use client'
import Link from 'next/link'
import ReviewText from '@/components/ui/ReviewText'
import { api } from '@/utils/api'

/**
 * What the people a Member follows shared about this Film: their ratings and
 * the reviews they chose to make public. Renders nothing until someone has.
 */
export default function CircleActivity({ filmId }: { filmId: string }) {
  const activity = api.social.filmActivity.useQuery(
    { filmId },
    { staleTime: 5 * 60_000, retry: false }
  )
  if (!activity.data?.length) return null
  return (
    <section className="mt-6" aria-labelledby="circle-activity">
      <p className="eyebrow">From your circle</p>
      <h2 id="circle-activity" className="section-heading mb-4 mt-2">
        What your people thought
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {activity.data.map((entry) => (
          <article key={entry.id} className="surface p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link
                prefetch={false}
                className="font-semibold text-pink-300"
                href={`/u/${entry.member.handle || entry.member.id}`}
              >
                {entry.member.name || 'A movie fan'}
              </Link>
              <span className="text-xs text-zinc-400">
                {entry.watchedAt.toLocaleDateString()}
              </span>
            </div>
            {entry.rating ? (
              <p
                className="mt-2 text-gold"
                aria-label={`Rated ${entry.rating} out of 5`}
              >
                {'★'.repeat(entry.rating)}
                <span className="text-zinc-600">
                  {'★'.repeat(5 - entry.rating)}
                </span>
              </p>
            ) : (
              <p className="mt-2 text-sm text-zinc-400">Watched, unrated</p>
            )}
            {entry.review && (
              <ReviewText text={entry.review} spoiler={entry.spoiler} />
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
