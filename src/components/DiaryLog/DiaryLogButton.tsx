'use client'
import { useState } from 'react'
import type { Film } from '@/server/catalog/types'
import Dialog from '@/components/ui/Dialog'
import WatchEditor from './WatchEditor'
export default function DiaryLogButton({
  film,
  initialRating = 0,
}: {
  film: Pick<Film, 'id' | 'title'>
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
        title={`Log ${film.title}`}
      >
        {open && (
          <WatchEditor
            film={film}
            initialRating={initialRating}
            onDirtyChange={setDirty}
            onSaved={() => setOpen(false)}
          />
        )}
      </Dialog>
    </>
  )
}
