'use client'
import { useState } from 'react'
import Link from 'next/link'
import { signIn, useSession } from 'next-auth/react'
import { api } from '@/utils/api'
import ReviewText from '@/components/ui/ReviewText'
import { notify, QueryError } from '@/components/ui/Feedback'
export default function CircleClient() {
  const { status } = useSession(),
    utils = api.useUtils(),
    [query, setQuery] = useState('')
  const feed = api.social.feed.useQuery(undefined, {
      enabled: status === 'authenticated',
    }),
    people = api.social.people.useQuery(
      { query },
      { enabled: status === 'authenticated' }
    ),
    connections = api.social.connections.useQuery(undefined, {
      enabled: status === 'authenticated',
    })
  const connect = api.social.connect.useMutation({
    onSuccess: () => {
      utils.social.invalidate()
      notify('Your circle updated')
    },
    onError: (e) => notify(e.message, 'error'),
  })
  if (status !== 'authenticated')
    return (
      <main className="page-shell max-w-2xl text-center">
        <p className="eyebrow">Good taste travels between friends</p>
        <h1 className="mt-3 text-4xl font-bold">Your circle</h1>
        <p className="mt-4 text-zinc-400">
          Follow people whose movie nights you’d like to borrow.
        </p>
        <button className="btn-brand mt-6" onClick={() => signIn()}>
          Find your people
        </button>
      </main>
    )
  const activity = [
    ...(feed.data?.entries.map((e) => ({
      kind: 'entry' as const,
      date: e.createdAt,
      id: e.id,
      userId: e.userId,
      entry: e,
    })) || []),
    ...(feed.data?.lists.map((l) => ({
      kind: 'list' as const,
      date: l.updatedAt,
      id: l.id,
      userId: l.userId,
      list: l,
    })) || []),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())
  return (
    <main className="page-shell">
      <p className="eyebrow">A small circle. A wider world of films.</p>
      <h1 className="mt-3 text-4xl font-bold">From your people</h1>
      <p className="mt-3 text-zinc-400">
        Shared movie nights and lists, newest first. Private diaries stay
        private.
      </p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          {feed.isError ? (
            <QueryError retry={() => feed.refetch()} />
          ) : (
            <div className="space-y-4">
              {activity.map((a) => {
                const user = feed.data?.users.find((u) => u.id === a.userId)
                return (
                  <article key={`${a.kind}-${a.id}`} className="surface p-5">
                    <Link
                      className="text-sm text-pink-300"
                      href={`/u/${user?.handle || a.userId}`}
                    >
                      {user?.name || 'A movie fan'}
                    </Link>
                    <span className="ml-2 text-xs text-zinc-400">
                      {a.date.toLocaleDateString()}
                    </span>
                    {a.kind === 'entry' ? (
                      <>
                        <h2 className="mt-3 text-xl font-semibold">
                          Logged{' '}
                          <Link href={`/movie/${a.entry.movieId}`}>
                            {a.entry.name}
                          </Link>
                        </h2>
                        {a.entry.rating && (
                          <p className="mt-2 text-yellow-300">
                            {a.entry.rating}★
                          </p>
                        )}
                        {a.entry.review && (
                          <ReviewText
                            text={a.entry.review}
                            spoiler={a.entry.spoiler}
                          />
                        )}
                      </>
                    ) : (
                      <h2 className="mt-3 text-xl font-semibold">
                        Updated{' '}
                        <Link
                          href={`/lists/${a.list.id}`}
                          className="text-pink-300"
                        >
                          {a.list.name}
                        </Link>
                        <span className="mt-1 block text-sm text-zinc-400">
                          {a.list._count.items} films
                        </span>
                      </h2>
                    )}
                    <div className="mt-4 flex gap-4 text-xs text-zinc-400">
                      <button
                        onClick={() =>
                          connect.mutate({
                            targetId: a.userId,
                            kind: 'MUTE',
                            enabled: true,
                          })
                        }
                      >
                        Mute activity
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              'Block this person? You’ll stop following each other.'
                            )
                          )
                            connect.mutate({
                              targetId: a.userId,
                              kind: 'BLOCK',
                              enabled: true,
                            })
                        }}
                      >
                        Block
                      </button>
                    </div>
                  </article>
                )
              })}
              {!activity.length && (
                <div className="surface p-8">
                  <h2 className="text-xl font-semibold">
                    Your circle starts with one person.
                  </h2>
                  <p className="mt-3 text-zinc-400">
                    Find a friend by name or handle. Their intentionally shared
                    entries and lists will appear here.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
        <aside>
          <h2 className="text-xl font-semibold">Find your people</h2>
          <input
            className="field mt-4"
            aria-label="Find people"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or handle…"
          />
          <div className="mt-4 space-y-3">
            {people.data?.map((p) => {
              const following = connections.data?.some(
                (c) => c.targetId === p.id && c.kind === 'FOLLOW'
              )
              return (
                <div key={p.id} className="surface p-4">
                  <Link
                    className="font-semibold"
                    href={`/u/${p.handle || p.id}`}
                  >
                    {p.name}
                  </Link>
                  {p.handle && (
                    <p className="text-xs text-zinc-400">@{p.handle}</p>
                  )}
                  <p className="mt-2 text-sm text-zinc-400">{p.bio}</p>
                  <button
                    className="mt-3 min-h-11 text-sm text-pink-300"
                    disabled={connect.isPending}
                    onClick={() =>
                      connect.mutate({
                        targetId: p.id,
                        kind: 'FOLLOW',
                        enabled: !following,
                      })
                    }
                  >
                    {following ? 'Following · unfollow' : 'Follow'}
                  </button>
                </div>
              )
            })}
          </div>
          <details className="mt-6">
            <summary className="text-sm text-zinc-400">
              Muted & blocked accounts
            </summary>
            {connections.data
              ?.filter((c) => c.kind !== 'FOLLOW')
              .map((c) => (
                <button
                  key={c.id}
                  className="mt-3 block text-sm text-pink-300"
                  onClick={() =>
                    connect.mutate({
                      targetId: c.targetId,
                      kind: c.kind as 'MUTE' | 'BLOCK',
                      enabled: false,
                    })
                  }
                >
                  Remove {c.kind.toLowerCase()} ·{' '}
                  {c.target.name || c.target.handle || 'Film fan'}
                </button>
              ))}
          </details>
        </aside>
      </div>
    </main>
  )
}
