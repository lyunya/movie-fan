'use client'
import { useState } from 'react'
import { HiPlay } from 'react-icons/hi'
import Dialog from './Dialog'

/**
 * "Play trailer" that opens a cinema-width dialog. The YouTube iframe only
 * mounts while the dialog is open, so nothing third-party loads until asked.
 */
export default function TrailerButton({
  url,
  title,
  className = 'btn-ghost',
}: {
  url: string
  title: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>
        <HiPlay className="h-5 w-5" aria-hidden />
        Play trailer
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`${title} · Trailer`}
        wide
      >
        {open && (
          <iframe
            src={`${url}?autoplay=1&rel=0`}
            title={`${title} trailer`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="aspect-video w-full rounded-xl border border-zinc-800 bg-black"
          />
        )}
      </Dialog>
    </>
  )
}
