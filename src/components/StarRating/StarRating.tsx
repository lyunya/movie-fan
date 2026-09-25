'use client'
import { useState } from 'react'
interface StarRatingProps {
  value?: number
  onChange?: (value: number) => void
  size?: number
  disabled?: boolean
}
export default function StarRating({
  value = 0,
  onChange,
  size = 28,
  disabled,
}: StarRatingProps) {
  const [preview, setPreview] = useState<number | null>(null)
  return (
    <div className="flex flex-wrap items-center gap-1">
      <div
        role="group"
        aria-label={`Your rating: ${value || 'unrated'} out of 5`}
        className="flex"
        onMouseLeave={() => setPreview(null)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setPreview(null)
        }}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            aria-label={`Rate ${n} out of 5 stars`}
            aria-pressed={value === n}
            className="flex h-11 w-9 items-center justify-center rounded-md sm:w-11"
            onMouseEnter={() => setPreview(n)}
            onFocus={() => setPreview(n)}
            onClick={() => onChange?.(n)}
          >
            <span
              aria-hidden
              style={{ fontSize: size }}
              className={
                n <= (preview ?? value) ? 'text-yellow-300' : 'text-zinc-500'
              }
            >
              ★
            </span>
          </button>
        ))}
      </div>
      {value > 0 && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange?.(0)}
          className="min-h-11 px-2 text-xs text-zinc-400 underline"
        >
          Clear
        </button>
      )}
    </div>
  )
}
