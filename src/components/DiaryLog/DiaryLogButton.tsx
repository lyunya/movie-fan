'use client'

import { useEffect, useState } from 'react'
import { HiOutlineBookOpen, HiX } from 'react-icons/hi'

import type { IMovieDetail } from '@/components/MovieDetails/types'
import StarRating from '@/components/StarRating/StarRating'
import { createMovieObj } from '@/utils/createMovieObj'
import { api } from '@/utils/api'

const today = () => {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

export default function DiaryLogButton({
  id,
  movie,
  initialRating = 0,
}: {
  id: string
  movie: IMovieDetail
  initialRating?: number
}) {
  const utils = api.useUtils()
  const [open, setOpen] = useState(false)
  const [watchedAt, setWatchedAt] = useState(today)
  const [rating, setRating] = useState(initialRating)
  const [review, setReview] = useState('')
  const [tags, setTags] = useState('')

  const log = api.diary.log.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.diary.list.invalidate(),
        utils.user.query.invalidate(),
        utils.movie.query.invalidate({ movieId: id }),
      ])
      setOpen(false)
      setReview('')
      setTags('')
      setWatchedAt(today())
    },
  })

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) setRating(initialRating)
  }, [initialRating, open])

  const submit = () => {
    const genres = movie.genres.map((genre) => genre.name)
    log.mutate({
      movieData: createMovieObj(movie, id, genres, rating || null),
      entry: {
        watchedAt: new Date(`${watchedAt}T12:00:00`),
        rating: rating || null,
        review: review.trim() || null,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 12),
      },
    })
  }

  return (
    <>
      <button className="btn-ghost" onClick={() => setOpen(true)}>
        <HiOutlineBookOpen className="h-5 w-5" /> Log watch
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="diary-title"
            className="surface max-h-[90vh] w-full max-w-xl overflow-y-auto bg-zinc-950 p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-pink-400">
                  Add to diary
                </p>
                <h2
                  id="diary-title"
                  className="mt-1 font-heading text-2xl font-bold"
                >
                  {movie.name}
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close diary form"
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-5">
              <label className="flex flex-col gap-2 text-sm font-semibold text-zinc-300">
                Watched on
                <input
                  type="date"
                  required
                  value={watchedAt}
                  onChange={(event) => setWatchedAt(event.target.value)}
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-pink-500"
                />
              </label>

              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-300">
                  Your rating
                </p>
                <StarRating value={rating} onChange={setRating} size={36} />
              </div>

              <label className="flex flex-col gap-2 text-sm font-semibold text-zinc-300">
                Quick review{' '}
                <span className="font-normal text-zinc-500">(optional)</span>
                <textarea
                  value={review}
                  maxLength={4000}
                  rows={5}
                  onChange={(event) => setReview(event.target.value)}
                  placeholder="What stuck with you?"
                  className="resize-y rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-normal text-white outline-none placeholder:text-zinc-600 focus:border-pink-500"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-zinc-300">
                Tags{' '}
                <span className="font-normal text-zinc-500">
                  (comma separated)
                </span>
                <input
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="with friends, theater, rewatch"
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-normal text-white outline-none placeholder:text-zinc-600 focus:border-pink-500"
                />
              </label>
            </div>

            {log.error && (
              <p className="mt-4 text-sm text-red-400">{log.error.message}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                className="btn-brand"
                disabled={!watchedAt || log.isPending}
                onClick={submit}
              >
                {log.isPending ? 'Saving…' : 'Save diary entry'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
