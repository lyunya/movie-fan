'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  HiCheck,
  HiOutlineClipboardCopy,
  HiOutlineThumbDown,
  HiOutlineThumbUp,
} from 'react-icons/hi'

import { api } from '@/utils/api'

const TOKEN_KEY = 'movie-fan-voter-token'
const NAME_KEY = 'movie-fan-voter-name'

export default function VotingRoomClient({ code }: { code: string }) {
  const utils = api.useUtils()
  const room = api.rooms.byCode.useQuery(
    { code },
    { retry: false, refetchInterval: 60_000 }
  )
  const [token, setToken] = useState('')
  const [name, setName] = useState('')
  const [ready, setReady] = useState(false)
  const [copied, setCopied] = useState(false)
  const vote = api.rooms.vote.useMutation({
    onSuccess: () => utils.rooms.byCode.invalidate({ code }),
  })

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY)
    const nextToken = storedToken || crypto.randomUUID()
    if (!storedToken) window.localStorage.setItem(TOKEN_KEY, nextToken)
    setToken(nextToken)
    setName(window.localStorage.getItem(NAME_KEY) || '')
  }, [])

  const ownVotes = useMemo(() => {
    const votes = new Map<string, boolean>()
    for (const candidate of room.data?.candidates ?? []) {
      const own = candidate.votes.find((entry) => entry.voterToken === token)
      if (own) votes.set(candidate.id, own.liked)
    }
    return votes
  }, [room.data?.candidates, token])
  const nextCandidate = room.data?.candidates.find(
    (candidate) => !ownVotes.has(candidate.id)
  )
  const finished = !!room.data && !nextCandidate
  const participants = new Set(
    (room.data?.candidates ?? []).flatMap((candidate) =>
      candidate.votes.map((entry) => entry.voterToken)
    )
  ).size
  const ranked = [...(room.data?.candidates ?? [])].sort((a, b) => {
    const likedA = a.votes.filter((entry) => entry.liked).length
    const likedB = b.votes.filter((entry) => entry.liked).length
    return likedB - likedA || a.position - b.position
  })

  const castVote = (candidateId: string, liked: boolean) => {
    if (!name.trim() || !token) return
    window.localStorage.setItem(NAME_KEY, name.trim())
    vote.mutate({
      code,
      candidateId,
      voterToken: token,
      voterName: name.trim(),
      liked,
    })
  }

  if (room.isLoading) return <main className="min-h-[65vh]" />
  if (!room.data) {
    return (
      <main className="mx-auto min-h-[65vh] max-w-xl px-4 py-24 text-center">
        <h1 className="font-heading text-3xl font-bold">Room not available</h1>
        <p className="mt-3 text-zinc-400">
          The link may be incorrect or the room may have expired.
        </p>
        <Link href="/rooms" className="btn-brand mt-6">
          Create a new room
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto w-11/12 max-w-screen-lg pb-16 pt-10">
      <header className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-pink-400">
          Hosted by {room.data.host.name || 'a movie fan'}
        </p>
        <h1 className="mt-2 font-heading text-4xl font-bold sm:text-5xl">
          {room.data.name}
        </h1>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-zinc-500">
          <span>
            {participants} {participants === 1 ? 'voter' : 'voters'}
          </span>
          <span>·</span>
          <button
            className="inline-flex items-center gap-1 text-pink-400"
            onClick={async () => {
              await navigator.clipboard.writeText(window.location.href)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
          >
            {copied ? <HiCheck /> : <HiOutlineClipboardCopy />}{' '}
            {copied ? 'Copied' : 'Invite friends'}
          </button>
        </div>
      </header>

      {!ready && ownVotes.size === 0 ? (
        <section className="surface mx-auto mt-10 max-w-md p-6 text-center">
          <h2 className="font-heading text-2xl font-bold">Join the ballot</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Your name is shown with the results so the group knows who voted.
          </p>
          <input
            autoFocus
            value={name}
            maxLength={40}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && name.trim()) setReady(true)
            }}
            placeholder="Your name"
            className="mt-5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-center text-white outline-none focus:border-pink-500"
          />
          <button
            className="btn-brand mt-4 w-full"
            disabled={!name.trim()}
            onClick={() => setReady(true)}
          >
            Start voting
          </button>
        </section>
      ) : !finished && nextCandidate ? (
        <section className="mx-auto mt-10 max-w-sm text-center">
          <p className="mb-3 text-sm text-zinc-500">
            {ownVotes.size + 1} of {room.data.candidates.length}
          </p>
          <div className="surface overflow-hidden">
            <div className="relative aspect-[2/3] w-full bg-zinc-900">
              <Image
                src={nextCandidate.posterImage || '/placeholderposter.png'}
                fill
                sizes="380px"
                alt={`${nextCandidate.name} poster`}
                className="object-cover"
                priority
              />
            </div>
            <div className="p-5">
              <h2 className="font-heading text-2xl font-bold">
                {nextCandidate.name}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {nextCandidate.releaseDate?.slice(0, 4) ||
                  'Release date unknown'}
                {nextCandidate.tomatoMeter != null
                  ? ` · ⭐ ${nextCandidate.tomatoMeter}%`
                  : ''}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  disabled={vote.isPending}
                  onClick={() => castVote(nextCandidate.id, false)}
                  className="btn-ghost !px-4"
                >
                  <HiOutlineThumbDown className="h-5 w-5" /> Pass
                </button>
                <button
                  disabled={vote.isPending}
                  onClick={() => castVote(nextCandidate.id, true)}
                  className="btn-brand !px-4"
                >
                  <HiOutlineThumbUp className="h-5 w-5" /> Yes
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-10">
          <div className="text-center">
            <p className="text-pink-400">Ballot complete</p>
            <h2 className="mt-1 font-heading text-3xl font-bold">
              The group&apos;s best matches
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {ranked.map((candidate, index) => {
              const yesVotes = candidate.votes.filter((entry) => entry.liked)
              return (
                <Link
                  key={candidate.id}
                  href={`/movie/${candidate.movieId}`}
                  className="surface flex gap-4 p-3 transition hover:border-zinc-600"
                >
                  <div className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={candidate.posterImage || '/placeholderposter.png'}
                      fill
                      sizes="80px"
                      alt=""
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 py-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-pink-400">
                      #{index + 1} · {yesVotes.length} yes
                    </p>
                    <h3 className="mt-1 truncate font-heading font-bold">
                      {candidate.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs text-zinc-500">
                      {yesVotes.length
                        ? yesVotes.map((entry) => entry.voterName).join(', ')
                        : 'No yes votes yet'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
