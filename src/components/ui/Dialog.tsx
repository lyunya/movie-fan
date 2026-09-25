'use client'
import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Shared modal. It never grows past the viewport: the header stays put and
 * only the body scrolls, and only when its content genuinely can't fit.
 * Padding and title size tighten on short windows so most dialogs fit
 * without scrolling at all.
 */
export default function Dialog({
  open,
  onClose,
  title,
  children,
  wide = false,
  contentScroll = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Size to the content (trailers, photos) instead of a fixed form width */
  wide?: boolean
  /**
   * The children manage their own scrolling region (e.g. a results list
   * under a pinned search field), so the body itself never scrolls.
   */
  contentScroll?: boolean
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
      className={`max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 p-0 text-white shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm open:flex ${wide ? 'w-fit max-w-[calc(100vw-2rem)]' : 'w-[calc(100%-2rem)] max-w-xl'}`}
    >
      <div
        className={`flex shrink-0 items-center justify-between gap-4 px-5 pb-3 pt-4 sm:px-7 sm:pb-4 sm:pt-6 [@media(max-height:720px)]:pb-2 [@media(max-height:720px)]:pt-3`}
      >
        <h2
          className={`min-w-0 truncate font-display text-xl font-semibold tracking-tight sm:text-2xl [@media(max-height:720px)]:text-xl`}
        >
          {title}
        </h2>
        <button
          className="icon-button -mr-2"
          aria-label="Close dialog"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <div
        className={`min-h-0 flex-1 px-5 pb-5 sm:px-7 sm:pb-7 [@media(max-height:720px)]:pb-4 ${contentScroll ? 'flex flex-col overflow-hidden' : 'overflow-y-auto overscroll-contain'}`}
      >
        {children}
      </div>
    </dialog>
  )
}
