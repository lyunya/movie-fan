'use client'
import { useEffect, useState } from 'react'
import type { WatchEvent } from '@prisma/client'
import type { FilmDetail } from '@/server/catalog/types'
import StarRating from '@/components/StarRating/StarRating'
import { createMovieObj } from '@/utils/createMovieObj'
import { api } from '@/utils/api'
import { notify } from '@/components/ui/Feedback'
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export default function WatchEditor({
  film,
  entry,
  initialRating = 0,
  onSaved,
  onDirtyChange,
}: {
  film?: FilmDetail
  entry?: WatchEvent
  initialRating?: number
  onSaved: () => void
  onDirtyChange?: (dirty: boolean) => void
}) {
  const utils = api.useUtils()
  const [date, setDate] = useState(
      entry?.watchedAt.toISOString().slice(0, 10) || today()
    ),
    [rating, setRating] = useState(entry?.rating || initialRating),
    [review, setReview] = useState(entry?.review || ''),
    [tags, setTags] = useState(entry?.tags.join(', ') || ''),
    [isPublic, setPublic] = useState(entry?.isPublic || false),
    [spoiler, setSpoiler] = useState(entry?.spoiler || false),
    [keep, setKeep] = useState(false),
    [updateRating, setUpdateRating] = useState(true)
  const dirty =
    date !== (entry?.watchedAt.toISOString().slice(0, 10) || today()) ||
    rating !== (entry?.rating || initialRating) ||
    review !== (entry?.review || '') ||
    tags !== (entry?.tags.join(', ') || '') ||
    isPublic !== (entry?.isPublic || false) ||
    spoiler !== (entry?.spoiler || false) ||
    keep ||
    !updateRating
  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])
  const onSuccess = async () => {
    await Promise.all([
      utils.diary.invalidate(),
      utils.user.query.invalidate(),
      utils.movie.query.invalidate(),
    ])
    notify(entry ? 'Diary entry updated' : 'Movie night remembered ✓')
    onSaved()
  }
  const log = api.diary.log.useMutation({ onSuccess }),
    edit = api.diary.update.useMutation({ onSuccess })
  const pending = log.isPending || edit.isPending
  return (
    <form
      className="space-y-3 [@media(max-height:720px)]:space-y-2"
      onSubmit={(e) => {
        e.preventDefault()
        const fields = {
          watchedAt: new Date(`${date}T12:00:00Z`),
          rating: rating || null,
          review: review.trim() || null,
          tags: [
            ...new Set(
              tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            ),
          ].slice(0, 12),
          isPublic,
          spoiler,
        }
        if (entry) edit.mutate({ id: entry.id, entry: fields })
        else if (film)
          log.mutate({
            movieData: createMovieObj(film),
            entry: fields,
            keepOnWatchlist: keep,
            updateRating,
          })
      }}
    >
      {/* Date and rating share a row so the whole form fits without scrolling */}
      <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
        <label className="field-label">
          Watched on
          <input
            required
            className="field"
            type="date"
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <div>
          <p className="field-label mb-2">Your rating · optional</p>
          <StarRating value={rating} onChange={setRating} disabled={pending} />
        </div>
      </div>
      <label className="field-label">
        What stayed with you?
        <textarea
          className="field [@media(max-height:720px)]:h-16"
          rows={3}
          maxLength={4000}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="A thought, a feeling, a line you loved…"
        />
      </label>
      <label className="field-label">
        Tags · separated by commas
        <input
          className="field"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="theater, with friends, rainy Sunday"
        />
      </label>
      {!entry && (
        <>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={keep}
              onChange={(e) => setKeep(e.target.checked)}
            />
            Keep on my watchlist for another watch
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={updateRating}
              onChange={(e) => setUpdateRating(e.target.checked)}
            />
            Use this viewing’s rating as my current movie rating
          </label>
        </>
      )}
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setPublic(e.target.checked)}
        />
        Share this entry on my public profile and with followers
      </label>
      {isPublic && (
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={spoiler}
            onChange={(e) => setSpoiler(e.target.checked)}
          />
          This review contains spoilers
        </label>
      )}
      {(log.error || edit.error) && (
        <p role="alert" className="text-sm text-red-300">
          {log.error?.message || edit.error?.message} Your draft is still here.
        </p>
      )}
      <button className="btn-brand w-full" disabled={pending}>
        {pending ? 'Saving…' : entry ? 'Save changes' : 'Log this watch'}
      </button>
    </form>
  )
}
