'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'

interface StarRatingProps {
  value?: number
  onChange?: (value: number) => void
  size?: number
}

// A small, dependency-free burst of particles for the 5-star moment
const CONFETTI_COLORS = ['#ec4899', '#f43f5e', '#facc15', '#38bdf8', '#a78bfa']
const CONFETTI_PIECES = 14

const StarRating = ({ value = 0, onChange, size = 32 }: StarRatingProps) => {
  const [hover, setHover] = useState(0)
  const [burst, setBurst] = useState(0)
  const active = hover || value

  const handleClick = (n: number) => {
    onChange?.(n)
    // Celebrate a perfect score, unless the user prefers reduced motion
    if (
      n === 5 &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      // key bump restarts the animation even on repeat 5-star clicks
      setBurst((b) => b + 1)
    }
  }

  return (
    <div className="relative flex" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onClick={() => handleClick(n)}
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

      {burst > 0 && (
        <div
          key={burst}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        >
          {Array.from({ length: CONFETTI_PIECES }).map((_, i) => {
            const angle = (360 / CONFETTI_PIECES) * i
            const distance = 26 + (i % 4) * 10
            const tx = Math.cos((angle * Math.PI) / 180) * distance
            const ty = Math.sin((angle * Math.PI) / 180) * distance
            return (
              <span
                key={i}
                className="confetti-piece absolute h-1.5 w-1.5 rounded-sm"
                style={
                  {
                    backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                    '--tx': `${tx}px`,
                    '--ty': `${ty}px`,
                  } as CSSProperties
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default StarRating
