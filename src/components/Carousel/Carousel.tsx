'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { FC } from 'react'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'
import type { CarouselProps } from './types'

/**
 * Full-bleed horizontal shelf. The first card lines up with the page column
 * (see .bleed-x) and cards run off the right edge of the screen, which reads
 * as "there's more" without a mask chopping the first poster.
 */
const Carousel: FC<CarouselProps> = ({ movieCards }) => {
  const scroller = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const updateEdges = useCallback(() => {
    const el = scroller.current
    if (!el) return
    setAtStart(el.scrollLeft <= 8)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8)
  }, [])

  useEffect(() => {
    updateEdges()
  }, [movieCards, updateEdges])

  const scrollByAmount = (direction: number) => {
    const el = scroller.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  const arrow =
    'absolute top-[38%] z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-ink/80 p-2 text-white shadow-xl backdrop-blur transition hover:bg-ink disabled:pointer-events-none disabled:opacity-0 sm:group-hover:flex'

  return (
    <div className="group relative w-full">
      <button
        onClick={() => scrollByAmount(-1)}
        aria-label="Scroll left"
        className={`${arrow} left-3 xl:left-[max(0.75rem,calc((100%-1280px)/2-1rem))]`}
        disabled={atStart}
      >
        <HiChevronLeft className="h-7 w-7" />
      </button>
      <button
        onClick={() => scrollByAmount(1)}
        aria-label="Scroll right"
        className={`${arrow} right-3`}
        disabled={atEnd}
      >
        <HiChevronRight className="h-7 w-7" />
      </button>
      <div
        ref={scroller}
        onScroll={updateEdges}
        className="hide-scrollbar bleed-x flex snap-x gap-4 overflow-x-auto scroll-smooth pb-2 pt-1 sm:gap-5"
      >
        {movieCards}
      </div>
    </div>
  )
}

export default Carousel
