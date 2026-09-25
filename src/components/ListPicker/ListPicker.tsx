'use client'
import { useState } from 'react'
import Link from 'next/link'
import { HiCheck, HiOutlineCollection } from 'react-icons/hi'
import type { IMovieDetail } from '@/components/MovieDetails/types'
import { api } from '@/utils/api'
import Dialog from '@/components/ui/Dialog'
import { notify, QueryError } from '@/components/ui/Feedback'

export default function ListPicker({
  id,
  movie,
}: {
  id: string
  movie: IMovieDetail
}) {
  const utils = api.useUtils()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [ranked, setRanked] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const lists = api.lists.all.useQuery(undefined, { enabled: open })
  const refresh = () => utils.lists.all.invalidate()
  const add = api.lists.addMovie.useMutation({
    onSuccess: refresh,
    onError: () =>
      notify('Could not add this film. Please try again.', 'error'),
  })
  const remove = api.lists.removeMovie.useMutation({
    onSuccess: refresh,
    onError: () =>
      notify('Could not remove this film. Please try again.', 'error'),
  })
  const create = api.lists.createWithMovie.useMutation()
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
        <HiOutlineCollection className="h-5 w-5" />
        Save to list
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Save ${movie.name}`}
      >
        {lists.isLoading && <p role="status">Loading your lists…</p>}
        {lists.isError && <QueryError retry={() => lists.refetch()} />}
        <div className="space-y-2">
          {lists.data?.map((list) => {
            const included = list.items.some((item) => item.movieId === id)
            return (
              <button
                key={list.id}
                disabled={add.isPending || remove.isPending}
                aria-pressed={included}
                onClick={() =>
                  included
                    ? remove.mutate({ listId: list.id, movieId: id })
                    : add.mutate({ listId: list.id, movie: summary })
                }
                className="flex w-full items-center justify-between rounded-xl border border-zinc-800 p-4 text-left hover:bg-zinc-900"
              >
                <span>
                  <strong className="block">{list.name}</strong>
                  <span className="text-sm text-zinc-400">
                    {list.ranked ? 'Ranking' : 'List'} · {list.items.length}{' '}
                    films
                  </span>
                </span>
                {included && <HiCheck className="h-5 w-5 text-pink-300" />}
              </button>
            )
          })}
        </div>
        <form
          className="mt-6 border-t border-zinc-800 pt-5"
          onSubmit={async (e) => {
            e.preventDefault()
            setCreating(true)
            setError('')
            try {
              await create.mutateAsync({
                name: name.trim(),
                ranked,
                movie: summary,
              })
              setName('')
              await refresh()
              notify('List created and film added')
            } catch {
              setError('Your list could not be created. Please try again.')
            } finally {
              setCreating(false)
            }
          }}
        >
          <label
            className="block text-sm font-semibold"
            htmlFor="new-list-name"
          >
            Create a new list
          </label>
          <input
            id="new-list-name"
            className="field mt-2"
            placeholder="Rainy Sunday favorites"
            value={name}
            maxLength={80}
            required
            onChange={(e) => setName(e.target.value)}
          />
          <label className="my-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={ranked}
              onChange={(e) => setRanked(e.target.checked)}
            />
            Rank these films
          </label>
          {error && (
            <p role="alert" className="mb-3 text-sm text-rose-300">
              {error}
            </p>
          )}
          <button disabled={creating || !name.trim()} className="btn-brand">
            {creating ? 'Creating…' : 'Create list & add film'}
          </button>
        </form>
        <Link href="/lists" className="mt-5 block text-sm text-pink-300">
          Manage your lists →
        </Link>
      </Dialog>
    </>
  )
}
