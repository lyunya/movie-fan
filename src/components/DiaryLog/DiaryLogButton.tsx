'use client'
import { useState } from 'react'
import type { IMovieDetail } from '@/components/MovieDetails/types'
import Dialog from '@/components/ui/Dialog'
import WatchEditor from './WatchEditor'
export default function DiaryLogButton({
  id,
  movie,
  initialRating = 0,
}: {
  id: string
  movie: IMovieDetail
  initialRating?: number
}) {
  const [open, setOpen] = useState(false)
  const [dirty, setDirty] = useState(false)
  return (
    <>
      <button className="btn-brand !px-4 !py-2.5" onClick={() => setOpen(true)}>
        Log watch
      </button>
      <Dialog
        open={open}
        onClose={() => {
          if (
            !dirty ||
            confirm('Close this diary draft? Unsaved changes will be lost.')
          )
            setOpen(false)
        }}
        title={`Log ${movie.name}`}
      >
        {open && (
          <WatchEditor
            movie={movie}
            id={id}
            initialRating={initialRating}
            onDirtyChange={setDirty}
            onSaved={() => setOpen(false)}
          />
        )}
      </Dialog>
    </>
  )
}
