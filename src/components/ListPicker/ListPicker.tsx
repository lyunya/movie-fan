'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HiCheck, HiOutlineCollection, HiX } from 'react-icons/hi'

import type { IMovieDetail } from '@/components/MovieDetails/types'
import { api } from '@/utils/api'

export default function ListPicker({
  id,
  movie,
}: {
  id: string
  movie: IMovieDetail
}) {
  const utils = api.useUtils()
  const [open, setOpen] = useState(false)
  const lists = api.lists.all.useQuery(undefined, { enabled: open })
  const add = api.lists.addMovie.useMutation({
    onSuccess: () => utils.lists.all.invalidate(),
  })
  const remove = api.lists.removeMovie.useMutation({
    onSuccess: () => utils.lists.all.invalidate(),
  })

  const summary = {
    movieId: id,
    name: movie.name,
    posterImage: movie.posterImage?.url ?? null,
    releaseDate: movie.releaseDate ?? null,
    tomatoMeter: movie.tomatoMeter ?? null,
  }

  return (
    <>
      <button className="btn-ghost" onClick={() => setOpen(true)}>
        <HiOutlineCollection className="h-5 w-5" /> Save to list
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="list-picker-title"
            className="surface w-full max-w-md bg-zinc-950 p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h2
                id="list-picker-title"
                className="font-heading text-xl font-bold"
              >
                Save {movie.name}
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close list picker"
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 flex max-h-80 flex-col gap-2 overflow-y-auto">
              {lists.isLoading ? (
                <p className="py-6 text-center text-zinc-500">Loading lists…</p>
              ) : lists.data?.length ? (
                lists.data.map((list) => {
                  const included = list.items.some(
                    (item) => item.movieId === id
                  )
                  const pending =
                    (add.isPending && add.variables?.listId === list.id) ||
                    (remove.isPending && remove.variables?.listId === list.id)
                  return (
                    <button
                      key={list.id}
                      disabled={pending}
                      onClick={() =>
                        included
                          ? remove.mutate({ listId: list.id, movieId: id })
                          : add.mutate({ listId: list.id, movie: summary })
                      }
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-left transition hover:border-zinc-600"
                    >
                      <span>
                        <span className="block font-semibold text-white">
                          {list.name}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {list.items.length}{' '}
                          {list.items.length === 1 ? 'movie' : 'movies'}
                        </span>
                      </span>
                      {included && (
                        <HiCheck className="h-5 w-5 text-pink-400" />
                      )}
                    </button>
                  )
                })
              ) : (
                <div className="py-6 text-center">
                  <p className="text-zinc-400">
                    You haven&apos;t created a list yet.
                  </p>
                  <Link
                    href="/lists"
                    className="btn-brand mt-4"
                    onClick={() => setOpen(false)}
                  >
                    Create your first list
                  </Link>
                </div>
              )}
            </div>
            {!!lists.data?.length && (
              <Link
                href="/lists"
                onClick={() => setOpen(false)}
                className="mt-4 block text-center text-sm text-pink-400 hover:text-pink-300"
              >
                Manage lists
              </Link>
            )}
          </section>
        </div>
      )}
    </>
  )
}
