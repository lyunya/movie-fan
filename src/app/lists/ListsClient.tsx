'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { signIn, useSession } from 'next-auth/react'
import {
  HiOutlineClipboardCopy,
  HiOutlineCollection,
  HiOutlineTrash,
} from 'react-icons/hi'

import MovieCard from '@/components/MovieCard/MovieCard'
import { api } from '@/utils/api'

export default function ListsClient() {
  const { status } = useSession()
  const utils = api.useUtils()
  const lists = api.lists.all.useQuery(undefined, {
    enabled: status === 'authenticated',
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  const create = api.lists.create.useMutation({
    onSuccess: async (created) => {
      await utils.lists.all.invalidate()
      setSelectedId(created.id)
      setName('')
      setDescription('')
      setIsPublic(false)
    },
  })
  const update = api.lists.update.useMutation({
    onSuccess: () => utils.lists.all.invalidate(),
  })
  const removeMovie = api.lists.removeMovie.useMutation({
    onSuccess: () => utils.lists.all.invalidate(),
  })
  const removeList = api.lists.delete.useMutation({
    onSuccess: async () => {
      setSelectedId(null)
      await utils.lists.all.invalidate()
    },
  })

  const selected = useMemo(
    () => lists.data?.find((list) => list.id === selectedId) ?? lists.data?.[0],
    [lists.data, selectedId]
  )

  if (status === 'loading') return <div className="min-h-[60vh]" />
  if (status !== 'authenticated') {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <HiOutlineCollection className="h-12 w-12 text-pink-400" />
        <h1 className="mt-5 font-heading text-4xl font-bold">
          Lists for every occasion
        </h1>
        <p className="mt-4 text-zinc-400">
          Build private collections or share your favorites with friends.
        </p>
        <button className="btn-brand mt-8" onClick={() => signIn()}>
          Sign in to create lists
        </button>
      </main>
    )
  }

  return (
    <main className="mx-auto w-11/12 max-w-screen-xl pb-16 pt-10">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-pink-400">
          Collections
        </p>
        <h1 className="mt-2 font-heading text-4xl font-bold sm:text-5xl">
          Your movie lists
        </h1>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="flex flex-col gap-5">
          <form
            className="surface p-5"
            onSubmit={(event) => {
              event.preventDefault()
              if (!name.trim()) return
              create.mutate({ name, description, isPublic })
            }}
          >
            <h2 className="font-heading text-lg font-bold">New list</h2>
            <div className="mt-4 flex flex-col gap-3">
              <input
                value={name}
                required
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
                placeholder="Date night"
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-pink-500"
              />
              <textarea
                value={description}
                maxLength={500}
                rows={3}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="A short description (optional)"
                className="resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-pink-500"
              />
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(event) => setIsPublic(event.target.checked)}
                  className="accent-pink-500"
                />
                Anyone with the link can view it
              </label>
              <button className="btn-brand !py-2.5" disabled={create.isPending}>
                {create.isPending ? 'Creating…' : 'Create list'}
              </button>
            </div>
          </form>

          <div className="flex flex-col gap-2">
            {(lists.data ?? []).map((list) => (
              <button
                key={list.id}
                onClick={() => setSelectedId(list.id)}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  selected?.id === list.id
                    ? 'border-pink-500 bg-pink-500/10'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-600'
                }`}
              >
                <span className="block font-semibold">{list.name}</span>
                <span className="text-xs text-zinc-500">
                  {list.items.length} movies
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section>
          {selected ? (
            <>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <h2 className="font-heading text-3xl font-bold">
                    {selected.name}
                  </h2>
                  {selected.description && (
                    <p className="mt-2 text-zinc-400">{selected.description}</p>
                  )}
                  <p className="mt-2 text-sm text-zinc-500">
                    {selected.isPublic ? 'Public by link' : 'Private'} ·{' '}
                    {selected.items.length} movies
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn-ghost !px-4 !py-2 !text-sm"
                    onClick={() =>
                      update.mutate({
                        id: selected.id,
                        name: selected.name,
                        description: selected.description,
                        isPublic: !selected.isPublic,
                      })
                    }
                  >
                    Make {selected.isPublic ? 'private' : 'public'}
                  </button>
                  {selected.isPublic && (
                    <button
                      className="btn-ghost !px-4 !py-2 !text-sm"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          `${window.location.origin}/lists/${selected.id}`
                        )
                      }
                    >
                      <HiOutlineClipboardCopy className="h-4 w-4" /> Copy link
                    </button>
                  )}
                  <button
                    className="btn-ghost !px-4 !py-2 !text-sm text-red-300"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete “${selected.name}”? The list can’t be recovered.`
                        )
                      ) {
                        removeList.mutate({ id: selected.id })
                      }
                    }}
                  >
                    <HiOutlineTrash className="h-4 w-4" /> Delete
                  </button>
                </div>
              </div>

              {selected.items.length ? (
                <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                  {selected.items.map((item) => (
                    <div key={item.id} className="relative">
                      <MovieCard
                        name={item.name}
                        emsVersionId={item.movieId}
                        posterImage={item.posterImage}
                        releaseDate={item.releaseDate}
                        tomatoMeter={item.tomatoMeter}
                      />
                      <button
                        aria-label={`Remove ${item.name} from ${selected.name}`}
                        onClick={() =>
                          removeMovie.mutate({
                            listId: selected.id,
                            movieId: item.movieId,
                          })
                        }
                        className="absolute -right-1 -top-2 z-20 rounded-full bg-zinc-950 p-1.5 text-zinc-400 shadow hover:text-red-300"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="surface mt-8 p-10 text-center">
                  <p className="text-zinc-300">
                    This list is ready for its first movie.
                  </p>
                  <Link href="/" className="btn-brand mt-5">
                    Find movies
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="surface p-10 text-center text-zinc-400">
              Create a list to get started.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
