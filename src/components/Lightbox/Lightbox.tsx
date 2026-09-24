'use client'
import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Dialog from '@/components/ui/Dialog'
export default function Lightbox({
  images,
  startIndex,
  altBase,
  onClose,
}: {
  images: { url: string }[]
  startIndex: number
  altBase: string
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const step = useCallback(
    (direction: number) =>
      setIndex((i) => (i + direction + images.length) % images.length),
    [images.length]
  )
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        step(-1)
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        step(1)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [step])
  if (!images[index]) return null
  return (
    <Dialog
      open
      onClose={onClose}
      title={`${altBase} · ${index + 1} of ${images.length}`}
    >
      <Image
        src={images[index]!.url}
        width={1200}
        height={800}
        alt={`${altBase}, photo ${index + 1}`}
        className="max-h-[60dvh] w-full rounded-lg object-contain"
      />
      {images.length > 1 && (
        <div className="mt-4 flex justify-between">
          <button className="btn-ghost" onClick={() => step(-1)}>
            ← Previous photo
          </button>
          <button className="btn-ghost" onClick={() => step(1)}>
            Next photo →
          </button>
        </div>
      )}
    </Dialog>
  )
}
