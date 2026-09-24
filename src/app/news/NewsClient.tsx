'use client'
import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import type { NewStory } from '@/types/main'
import { api } from '@/utils/api'
import { notify, QueryError } from '@/components/ui/Feedback'
export default function NewsClient({
  stories,
  failedSources = [],
}: {
  stories: NewStory[]
  failedSources?: string[]
}) {
  const { status } = useSession(),
    utils = api.useUtils()
  const [tab, setTab] = useState('All'),
    [topic, setTopic] = useState('')
  const user = api.user.query.useQuery(undefined, {
    enabled: status === 'authenticated',
  })
  const bookmarks = api.news.bookmarks.useQuery(undefined, {
    enabled: status === 'authenticated',
  })
  const save = api.news.bookmark.useMutation({
    onSuccess: () => utils.news.bookmarks.invalidate(),
    onError: () => notify('Could not update your reading list.', 'error'),
  })
  const prefs = api.news.preferences.useMutation({
    onSuccess: () => {
      utils.user.query.invalidate()
      setTopic('')
    },
    onError: () => notify('Could not save your topics.', 'error'),
  })
  const followed = user.data?.user?.newsTopics || [],
    muted = user.data?.user?.mutedNewsTopics || []
  const visible = stories.filter(
    (s) =>
      !muted.includes(s.topic || '') &&
      (tab === 'All' ||
        s.topic === tab ||
        (tab === 'For you' &&
          [
            ...followed,
            ...(user.data?.movies
              .filter((m) => m.inWatchlist || m.favorite)
              .map((m) => m.name) || []),
          ].some((t) => s.title.toLowerCase().includes(t.toLowerCase()))))
  )
  return (
    <main className="page-shell">
      {!!failedSources.length && (
        <p role="status" className="surface mb-5 p-4 text-sm text-amber-200">
          Coverage from {failedSources.join(', ')} is temporarily unavailable.{' '}
          {stories.length
            ? 'You can still read stories from the other sources.'
            : 'Please check back shortly.'}
        </p>
      )}
      <p className="eyebrow">News, with a little context</p>
      <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">
        The latest reel
      </h1>
      <p className="mt-3 max-w-2xl text-zinc-400">
        Fresh stories from film publishers. Follow the movies and people you
        care about, or save a story for later.
      </p>
      <div className="my-6 flex flex-wrap gap-2">
        {[
          'All',
          'For you',
          'Releases',
          'Trailers',
          'Festivals & awards',
          'Industry',
          'Read later',
        ].map((t) => (
          <button
            key={t}
            className="filter-chip"
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {status === 'authenticated' && (
        <details className="surface mb-6 p-4">
          <summary>Your topics & muted sections</summary>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (topic.trim())
                prefs.mutate({
                  newsTopics: [...followed, topic.trim()].slice(0, 30),
                  mutedNewsTopics: muted,
                })
            }}
          >
            <input
              aria-label="Film, person or topic to follow"
              className="field"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Follow a film or person…"
            />
            <button className="btn-ghost" disabled={prefs.isPending}>
              Follow
            </button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {followed.map((t) => (
              <button
                key={t}
                className="filter-chip"
                onClick={() =>
                  prefs.mutate({
                    newsTopics: followed.filter((x) => x !== t),
                    mutedNewsTopics: muted,
                  })
                }
              >
                Unfollow {t} ×
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-zinc-400">Hide sections</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {['Releases', 'Trailers', 'Festivals & awards', 'Industry'].map(
              (t) => (
                <button
                  key={t}
                  className="filter-chip"
                  aria-pressed={muted.includes(t)}
                  onClick={() =>
                    prefs.mutate({
                      newsTopics: followed,
                      mutedNewsTopics: muted.includes(t)
                        ? muted.filter((x) => x !== t)
                        : [...muted, t],
                    })
                  }
                >
                  {t}
                </button>
              )
            )}
          </div>
        </details>
      )}
      {tab === 'Read later' ? (
        bookmarks.isError ? (
          <QueryError retry={() => bookmarks.refetch()} />
        ) : (
          <div className="space-y-3">
            {bookmarks.data?.map((s) => (
              <article className="surface p-5" key={s.id}>
                <p className="text-xs text-zinc-400">{s.source}</p>
                <a
                  className="mt-2 block text-xl"
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {s.title} ↗
                </a>
                <button
                  className="mt-3 text-sm text-pink-300"
                  onClick={() => save.mutate({ ...s, saved: false })}
                >
                  Remove bookmark
                </button>
              </article>
            ))}
            {!bookmarks.data?.length && (
              <p className="surface p-8">
                {status === 'authenticated'
                  ? 'Save a story to read it later.'
                  : 'Sign in to keep a reading list.'}
              </p>
            )}
          </div>
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((s) => (
            <article key={s.id} className="surface flex flex-col p-5 sm:p-6">
              <p className="eyebrow">{s.topic}</p>
              <h2 className="mt-3 text-xl font-bold">
                <a
                  href={s.link}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-pink-300"
                >
                  {s.title} ↗
                </a>
              </h2>
              <p className="mt-3 text-sm text-zinc-400">
                {s.source} ·{' '}
                {s.publishedAt
                  ? new Date(s.publishedAt).toLocaleDateString()
                  : 'Date unavailable'}
              </p>
              {!!s.coverage?.length && (
                <details className="mt-4 text-sm">
                  <summary>More coverage ({s.coverage.length})</summary>
                  {s.coverage.map((c) => (
                    <a
                      key={c.link}
                      className="mt-2 block text-pink-300"
                      href={c.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {c.source}: {c.title} ↗
                    </a>
                  ))}
                </details>
              )}
              <button
                className="mt-5 self-start text-sm text-pink-300"
                disabled={save.isPending}
                onClick={() =>
                  status !== 'authenticated'
                    ? signIn()
                    : save.mutate({
                        url: s.link,
                        title: s.title,
                        source: s.source || '',
                        saved: !bookmarks.data?.some((b) => b.url === s.link),
                      })
                }
              >
                {bookmarks.data?.some((b) => b.url === s.link)
                  ? 'Saved · remove'
                  : 'Read later'}
              </button>
            </article>
          ))}
          {!visible.length && (
            <p className="surface p-8">
              {tab === 'For you'
                ? 'Follow a topic or save a movie to find related headlines here.'
                : 'No stories in this section right now.'}
            </p>
          )}
        </div>
      )}
    </main>
  )
}
