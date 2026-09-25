'use client'
import { useEffect, useRef, type ReactNode } from 'react'
export default function Dialog({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Cinema-width dialog for trailers and galleries */
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const dialog = ref.current
    if (!dialog || !open) return
    const previous = document.activeElement as HTMLElement | null
    dialog.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [open])
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        close.current()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close.current()
      }}
      aria-label={title}
      className={`w-[calc(100%-2rem)] ${wide ? 'max-w-5xl' : 'max-w-xl'} rounded-2xl border border-zinc-700 bg-zinc-950 p-0 text-white shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm`}
    >
      <div className="max-h-[85dvh] overflow-auto p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            {title}
          </h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
