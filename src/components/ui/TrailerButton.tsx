'use client'
import { useState } from 'react'
import { HiPlay } from 'react-icons/hi'
import Dialog from './Dialog'
import { trailerEmbedUrl } from '@/utils/film'

/**
 * "Play trailer" that opens a cinema-width dialog. The YouTube iframe only
 * mounts while the dialog is open, so nothing third-party loads until asked.
 */
export default function TrailerButton({
  trailerKey,
  title,
  className = 'btn-ghost',
}: {
  /** YouTube video key */
  trailerKey: string
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
            src={`${trailerEmbedUrl(trailerKey)}?autoplay=1&rel=0`}
            title={`${title} trailer`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            // Scale the 16:9 player to whichever runs out first — screen width
            // or screen height — so the dialog never needs to scroll.
            style={{
              width:
                'min(60rem, calc(100vw - 5.75rem), calc((100dvh - 9rem) * 16 / 9))',
            }}
            className="mx-auto block aspect-video rounded-xl border border-zinc-800 bg-black"
          />
        )}
      </Dialog>
    </>
  )
}
