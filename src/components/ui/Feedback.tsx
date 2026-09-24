'use client'
import { useEffect, useState } from 'react'
export function notify(
  message: string,
  tone: 'success' | 'error' = 'success',
  undo?: () => void
) {
  window.dispatchEvent(
    new CustomEvent('movie-fan-feedback', { detail: { message, tone, undo } })
  )
}
export default function Feedback() {
  const [notice, setNotice] = useState<{
    message: string
    tone: string
    undo?: () => void
  } | null>(null)
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const listener = (event: Event) => {
      setNotice((event as CustomEvent).detail)
      clearTimeout(timeout)
      timeout = setTimeout(() => setNotice(null), 10000)
    }
    window.addEventListener('movie-fan-feedback', listener)
    return () => {
      window.removeEventListener('movie-fan-feedback', listener)
      clearTimeout(timeout)
    }
  }, [])
  return (
    <div
      className="fixed inset-x-4 bottom-24 z-[100] mx-auto max-w-md"
      aria-live="polite"
      aria-atomic="true"
    >
      {notice && (
        <div
          className={`surface flex items-center justify-between gap-4 bg-zinc-900 p-4 shadow-xl ${notice.tone === 'error' ? 'border-red-400' : 'border-pink-400'}`}
        >
          <p>{notice.message}</p>
          {notice.undo && (
            <button
              className="min-h-11 font-semibold text-pink-300"
              onClick={() => {
                const undo = notice.undo
                setNotice(null)
                undo?.()
              }}
            >
              Undo
            </button>
          )}
          <button aria-label="Dismiss message" onClick={() => setNotice(null)}>
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
export function QueryError({
  message = 'We couldn’t load this right now.',
  retry,
}: {
  message?: string
  retry: () => void
}) {
  return (
    <div role="alert" className="surface my-6 p-6">
      <p>{message}</p>
      <button className="btn-ghost mt-3" onClick={retry}>
        Try again
      </button>
    </div>
  )
}
