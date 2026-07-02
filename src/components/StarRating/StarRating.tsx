'use client'

import { useState } from 'react'

interface StarRatingProps {
  value?: number
  onChange?: (value: number) => void
  size?: number
}

const StarRating = ({ value = 0, onChange, size = 32 }: StarRatingProps) => {
  const [hover, setHover] = useState(0)
  const active = hover || value

  return (
    <div className="flex" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onClick={() => onChange?.(n)}
          className="px-0.5 leading-none transition-transform hover:scale-110"
        >
          <span
            style={{ fontSize: size }}
            className={n <= active ? 'text-yellow-400' : 'text-zinc-600'}
          >
            ★
          </span>
        </button>
      ))}
    </div>
  )
}

export default StarRating
