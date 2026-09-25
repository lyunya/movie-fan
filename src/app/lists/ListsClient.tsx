'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { signIn, useSession } from 'next-auth/react'
import { api } from '@/utils/api'
import { POSTER_PLACEHOLDER, filmImage, filmSummary } from '@/utils/film'
import Dialog from '@/components/ui/Dialog'
import ComparisonSession from '@/components/ui/ComparisonSession'
import MovieFinder from '@/components/ui/MovieFinder'
import { notify, QueryError } from '@/components/ui/Feedback'
export default function ListsClient() {
  const { status } = useSession(),
    utils = api.useUtils()
  const lists = api.lists.all.useQuery(undefined, {
    enabled: status === 'authenticated',
  })
  const [comparison, setComparison] = useState<
    NonNullable<typeof lists.data>[number] | null
  >(null)
  const [selectedId, setSelectedId] = useState<string | null>(null),
    [editor, setEditor] = useState<'new' | 'edit' | null>(null),
    [finder, setFinder] = useState(false)
  const [name, setName] = useState(''),
    [description, setDescription] = useState(''),
    [ranked, setRanked] = useState(true),
    [isPublic, setPublic] = useState(false)
  const [drag, setDrag] = useState<string | null>(null),
    [note, setNote] = useState<{ movieId: string; value: string } | null>(null)
  const invalidate = () => utils.lists.all.invalidate()
  const error = (e: { message: string }) => notify(e.message, 'error')
  const create = api.lists.create.useMutation({
    onSuccess: async (l) => {
      await invalidate()
      setSelectedId(l.id)
      setEditor(null)
      setFinder(true)
    },
    onError: error,
  })
  const update = api.lists.update.useMutation({
    onSuccess: () => {
      invalidate()
      setEditor(null)
      notify('List updated')
    },
    onError: error,
  })
  const add = api.lists.addMovie.useMutation({
    onSuccess: () => {
      invalidate()
      notify('Film added')
    },
    onError: error,
  })
  const remove = api.lists.removeMovie.useMutation({
    onSuccess: invalidate,
    onError: error,
  })
  const reorder = api.lists.reorder.useMutation({
    onSuccess: invalidate,
    onError: (e) => {
      error(e)
      invalidate()
    },
  })
  const saveNote = api.lists.note.useMutation({
    onSuccess: () => {
      invalidate()
      setNote(null)
    },
    onError: error,
  })
  const del = api.lists.delete.useMutation({
    onSuccess: () => {
      invalidate()
      setSelectedId(null)
    },
    onError: error,
  })
  const selected =
    lists.data?.find((l) => l.id === selectedId) || lists.data?.[0]
  const move = (id: string, index: number) => {
    if (!selected || reorder.isPending) return
    const ids = selected.items.map((i) => i.id)
    const from = ids.indexOf(id)
    if (from < 0) return
    ids.splice(from, 1)
    ids.splice(Math.max(0, Math.min(index, ids.length)), 0, id)
    reorder.mutate({ id: selected.id, version: selected.version, itemIds: ids })
  }
  if (status === 'loading')
    return (
      <main className="page-shell">
        <div className="surface h-72 animate-pulse" />
      </main>
    )
  if (status !== 'authenticated')
    return (
      <main className="page-shell max-w-2xl text-center">
        <p className="eyebrow">Your taste. Your order.</p>
        <h1 className="mt-3 text-4xl font-semibold">
          Every favorite deserves a place.
        </h1>
        <p className="mt-4 text-zinc-400">
          Build your Top 10, a perfect double feature, or a rainy Sunday
          watchlist.
        </p>
        <button className="btn-brand mt-6" onClick={() => signIn()}>
          Create your first list
        </button>
      </main>
    )
  return (
    <main className="page-shell">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/library" className="eyebrow">
            Your library
          </Link>
          <h1 className="mt-3 text-4xl font-semibold">Lists & rankings</h1>
        </div>
        <button
          className="btn-brand"
          onClick={() => {
            setName('My Top 10')
            setDescription('')
            setRanked(true)
            setPublic(false)
            setEditor('new')
          }}
        >
          + New list
        </button>
      </div>
      {lists.isError ? (
        <QueryError retry={() => lists.refetch()} />
      ) : lists.isLoading ? (
        <div className="surface mt-6 h-64 animate-pulse" />
      ) : (
        <div className="mt-7 grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="flex flex-col gap-2">
            {lists.data?.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelectedId(l.id)}
                className={`surface p-4 text-left ${selected?.id === l.id ? '!border-pink-400' : ''}`}
              >
                <span className="block font-semibold">
                  {l.ranked ? '# ' : ''}
                  {l.name}
                </span>
                <span className="text-xs text-zinc-400">
                  {l.items.length} films ·{' '}
                  {l.isPublic ? 'Shared by link' : 'Private'}
                </span>
              </button>
            ))}
          </aside>
          <section>
            {selected ? (
              <>
                <header className="mb-6">
                  <p className="eyebrow">
                    {selected.ranked ? 'A personal ranking' : 'A collection'} ·{' '}
                    {selected.isPublic ? 'Shared by link' : 'Private'}
                  </p>
                  <h2 className="mt-2 text-3xl font-bold">{selected.name}</h2>
                  {selected.description && (
                    <p className="mt-2 text-zinc-400">{selected.description}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="btn-brand !px-4 !py-2"
                      onClick={() => setFinder(true)}
                    >
                      + Add films
                    </button>
                    <button
                      className="btn-ghost !px-4 !py-2"
                      onClick={() => {
                        setName(selected.name)
                        setDescription(selected.description || '')
                        setRanked(selected.ranked)
                        setPublic(selected.isPublic)
                        setEditor('edit')
                      }}
                    >
                      Edit list
                    </button>
                    {selected.ranked && selected.items.length > 1 && (
                      <button
                        className="btn-ghost !px-4 !py-2"
                        onClick={() => setComparison(selected)}
                      >
                        Compare films
                      </button>
                    )}
                    {selected.isPublic && (
                      <button
                        className="btn-ghost !px-4 !py-2"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              `${location.origin}/lists/${selected.id}`
                            )
                            notify('Link copied')
                          } catch {
                            notify('Could not copy the link.', 'error')
                          }
                        }}
                      >
                        Copy link
                      </button>
                    )}
                    <button
                      className="btn-ghost !px-4 !py-2"
                      onClick={() => {
                        if (
                          confirm(
                            `Delete “${selected.name}”? Your library and ratings will be kept.`
                          )
                        )
                          del.mutate({ id: selected.id })
                      }}
                    >
                      Delete list
                    </button>
                  </div>
                </header>
                <ol className="space-y-3">
                  {selected.items.map((item, i) => (
                    <li
                      key={item.id}
                      draggable={selected.ranked && !reorder.isPending}
                      onDragStart={() => setDrag(item.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        if (drag) move(drag, i)
                        setDrag(null)
                      }}
                      className="surface flex gap-3 p-3 sm:gap-5 sm:p-4"
                    >
                      {selected.ranked && (
                        <span className="self-center text-xl font-bold text-pink-300 sm:text-3xl">
                          {i + 1}
                        </span>
                      )}
                      <Link
                        prefetch={false}
                        className="shrink-0"
                        href={`/movie/${item.movieId}`}
                      >
                        <Image
                          src={
                            filmImage(item.posterImage, 'w185') ||
                            POSTER_PLACEHOLDER
                          }
                          width={64}
                          height={96}
                          className="rounded"
                          alt={`${item.name} poster`}
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          prefetch={false}
                          className="font-semibold hover:text-pink-300"
                          href={`/movie/${item.movieId}`}
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-zinc-400">
                          {item.releaseDate?.slice(0, 4)}
                        </p>
                        {item.note && (
                          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">
                            {item.note}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-pink-300">
                          <button
                            onClick={() =>
                              setNote({
                                movieId: item.movieId,
                                value: item.note || '',
                              })
                            }
                          >
                            {item.note ? 'Edit note' : 'Add a note'}
                          </button>
                          <button
                            onClick={() =>
                              update.mutate({
                                id: selected.id,
                                name: selected.name,
                                description: selected.description,
                                isPublic: selected.isPublic,
                                coverMovieId: item.movieId,
                              })
                            }
                          >
                            {selected.coverMovieId === item.movieId
                              ? '✓ Cover'
                              : 'Use as cover'}
                          </button>
                          <button
                            disabled={remove.isPending}
                            onClick={() =>
                              remove.mutate({
                                listId: selected.id,
                                movieId: item.movieId,
                              })
                            }
                          >
                            Remove
                          </button>
                        </div>
                        {selected.ranked && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              aria-label={`Move ${item.name} up`}
                              className="icon-button border border-zinc-700"
                              disabled={i === 0 || reorder.isPending}
                              onClick={() => move(item.id, i - 1)}
                            >
                              ↑
                            </button>
                            <button
                              aria-label={`Move ${item.name} down`}
                              className="icon-button border border-zinc-700"
                              disabled={
                                i === selected.items.length - 1 ||
                                reorder.isPending
                              }
                              onClick={() => move(item.id, i + 1)}
                            >
                              ↓
                            </button>
                            <label className="flex items-center gap-2 text-xs text-zinc-400">
                              Position
                              <select
                                className="rounded-lg bg-zinc-900 p-2"
                                value={i}
                                disabled={reorder.isPending}
                                onChange={(e) =>
                                  move(item.id, Number(e.target.value))
                                }
                              >
                                {selected.items.map((_, j) => (
                                  <option key={j} value={j}>
                                    {j + 1}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
                {!selected.items.length && (
                  <p className="surface p-8 text-zinc-400">
                    The first spot is waiting. Add a film to get started.
                  </p>
                )}
              </>
            ) : (
              <p className="surface p-10 text-zinc-400">
                Make a Top 10, a date-night collection, or something entirely
                your own.
              </p>
            )}
          </section>
        </div>
      )}
      {comparison && (
        <ComparisonSession
          list={comparison}
          onClose={() => setComparison(null)}
        />
      )}
      <Dialog
        open={editor !== null}
        onClose={() => setEditor(null)}
        title={editor === 'new' ? 'Create a list' : 'Edit your list'}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (editor === 'new')
              create.mutate({ name, description, isPublic, ranked })
            else if (selected)
              update.mutate({
                id: selected.id,
                name,
                description,
                isPublic,
                ranked,
              })
          }}
        >
          <label className="field-label">
            Name
            <input
              className="field"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="field-label">
            Description
            <textarea
              className="field"
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={ranked}
              onChange={(e) => setRanked(e.target.checked)}
            />
            Rank these films
          </label>
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setPublic(e.target.checked)}
            />
            Anyone with the link can view
          </label>
          <button
            className="btn-brand"
            disabled={create.isPending || update.isPending}
          >
            Save list
          </button>
        </form>
      </Dialog>
      <Dialog
        open={finder}
        onClose={() => setFinder(false)}
        title={`Add to ${selected?.name || 'your list'}`}
      >
        <MovieFinder
          busy={add.isPending}
          onChoose={(m) => {
            if (selected)
              add.mutate({
                listId: selected.id,
                movie: filmSummary(m),
              })
          }}
        />
      </Dialog>
      <Dialog
        open={!!note}
        onClose={() => setNote(null)}
        title="Why this film belongs"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (note && selected)
              saveNote.mutate({
                listId: selected.id,
                movieId: note.movieId,
                note: note.value,
              })
          }}
        >
          <textarea
            aria-label="Your note"
            maxLength={1000}
            className="field"
            rows={5}
            value={note?.value || ''}
            onChange={(e) =>
              setNote((n) => (n ? { ...n, value: e.target.value } : null))
            }
          />
          <button className="btn-brand mt-4" disabled={saveNote.isPending}>
            Save note
          </button>
        </form>
      </Dialog>
    </main>
  )
}
