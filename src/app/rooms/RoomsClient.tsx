'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { HiOutlineUserGroup } from 'react-icons/hi'

import { api } from '@/utils/api'

const MOODS = [
  { label: 'Anything', genres: [] as number[] },
  { label: 'Comedy', genres: [35] },
  { label: 'Action', genres: [28] },
  { label: 'Horror', genres: [27] },
  { label: 'Romance', genres: [10749] },
  { label: 'Sci-fi', genres: [878] },
]

export default function RoomsClient() {
  const { status } = useSession()
  const router = useRouter()
  const mine = api.rooms.mine.useQuery(undefined, {
    enabled: status === 'authenticated',
  })
  const [name, setName] = useState('Friday movie night')
  const [mood, setMood] = useState(0)
  const [runtime, setRuntime] = useState<number | undefined>(120)
  const [score, setScore] = useState(60)
  const create = api.rooms.create.useMutation({
    onSuccess: ({ shareCode }) => router.push(`/room/${shareCode}`),
  })

  if (status === 'loading') return <div className="min-h-[60vh]" />
  if (status !== 'authenticated') {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <HiOutlineUserGroup className="h-12 w-12 text-pink-400" />
        <h1 className="mt-5 font-heading text-4xl font-bold sm:text-5xl">
          Find the movie everyone wants
        </h1>
        <p className="mt-4 text-zinc-400">
          Create a room, share one link, and reveal the group&apos;s matches
          after everyone votes.
        </p>
        <button className="btn-brand mt-8" onClick={() => signIn()}>
          Sign in to host a room
        </button>
      </main>
    )
  }

  return (
    <main className="mx-auto w-11/12 max-w-screen-xl pb-16 pt-10">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-pink-400">
          Group picker
        </p>
        <h1 className="mt-2 font-heading text-4xl font-bold sm:text-5xl">
          Movie night rooms
        </h1>
        <p className="mt-3 text-zinc-400">
          Everyone votes yes or no. The strongest shared matches rise to the
          top.
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,680px)_1fr]">
        <form
          className="surface p-6"
          onSubmit={(event) => {
            event.preventDefault()
            create.mutate({
              name,
              filters: {
                genreIds: MOODS[mood]?.genres ?? [],
                maxRuntime: runtime,
                minScore: score,
              },
            })
          }}
        >
          <h2 className="font-heading text-2xl font-bold">Create a room</h2>
          <label className="mt-5 flex flex-col gap-2 text-sm font-semibold text-zinc-300">
            Room name
            <input
              required
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-pink-500"
            />
          </label>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold text-zinc-300">
              Mood
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {MOODS.map((option, index) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setMood(index)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    mood === index
                      ? 'bg-gradient-to-br from-pink-500 to-red-600'
                      : 'border border-zinc-700 bg-zinc-900 text-zinc-400'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold text-zinc-300">
              Maximum runtime
              <select
                value={runtime ?? ''}
                onChange={(event) =>
                  setRuntime(
                    event.target.value ? Number(event.target.value) : undefined
                  )
                }
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none"
              >
                <option value="90">90 minutes</option>
                <option value="120">2 hours</option>
                <option value="150">2½ hours</option>
                <option value="">Any length</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-zinc-300">
              Minimum score: {score}%
              <input
                type="range"
                min="40"
                max="85"
                step="5"
                value={score}
                onChange={(event) => setScore(Number(event.target.value))}
                className="mt-3 accent-pink-500"
              />
            </label>
          </div>

          {create.error && (
            <p className="mt-4 text-sm text-red-400">{create.error.message}</p>
          )}
          <button className="btn-brand mt-6" disabled={create.isPending}>
            {create.isPending ? 'Building the ballot…' : 'Create voting room'}
          </button>
        </form>

        <section>
          <h2 className="font-heading text-xl font-bold">Your recent rooms</h2>
          <div className="mt-4 flex flex-col gap-3">
            {mine.data?.length ? (
              mine.data.map((room) => {
                const participants = new Set(
                  room.candidates.flatMap((candidate) =>
                    candidate.votes.map((vote) => vote.voterToken)
                  )
                ).size
                return (
                  <Link
                    key={room.id}
                    href={`/room/${room.shareCode}`}
                    className="surface p-4 transition hover:border-zinc-600"
                  >
                    <span className="font-semibold text-white">
                      {room.name}
                    </span>
                    <span className="mt-1 block text-sm text-zinc-500">
                      {participants} {participants === 1 ? 'voter' : 'voters'} ·{' '}
                      {room._count.candidates} choices
                    </span>
                  </Link>
                )
              })
            ) : (
              <p className="surface p-5 text-sm text-zinc-500">
                No rooms yet. Your first one will stay active for 14 days.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
