'use client'

/**
 * Minimal dependency-free image lightbox: backdrop click / Esc to close,
 * arrow keys or on-screen chevrons to navigate, with a position counter.
 */
import { useCallback, useEffect, useState } from 'react'
import type { FC } from 'react'
import Image from 'next/image'
import { HiChevronLeft, HiChevronRight, HiX } from 'react-icons/hi'

interface LightboxProps {
  images: { url: string }[]
  startIndex: number
  altBase: string
  onClose: () => void
}

const Lightbox: FC<LightboxProps> = ({
  images,
  startIndex,
  altBase,
  onClose,
}) => {
  const [index, setIndex] = useState(startIndex)

  const step = useCallback(
    (direction: number) =>
      setIndex((current) => (current + direction + images.length) % images.length),
    [images.length]
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') step(-1)
      if (e.key === 'ArrowRight') step(1)
    }
    window.addEventListener('keydown', onKeyDown)
    // Lock page scroll while the lightbox is open
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose, step])

  const image = images[index]
  if (!image) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${altBase} photo viewer`}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close photo viewer"
        className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/90"
      >
        <HiX className="h-6 w-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              step(-1)
            }}
            aria-label="Previous photo"
            className="absolute left-3 z-10 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/90 sm:left-6"
          >
            <HiChevronLeft className="h-7 w-7" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              step(1)
            }}
            aria-label="Next photo"
            className="absolute right-3 z-10 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/90 sm:right-6"
          >
            <HiChevronRight className="h-7 w-7" />
          </button>
        </>
      )}

      <figure
        className="relative h-[80vh] w-[92vw] max-w-6xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={image.url}
          fill
          sizes="92vw"
          alt={`${altBase} still ${index + 1}`}
          className="object-contain"
        />
        <figcaption className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-sm text-zinc-300 backdrop-blur">
          {index + 1} / {images.length}
        </figcaption>
      </figure>
    </div>
  )
}

export default Lightbox
