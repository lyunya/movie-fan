import { useState, useRef, useEffect, useCallback } from 'react'
import type { FC } from 'react'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'
import type { CarouselProps } from './types'

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

  return (
    <div className="group relative mx-auto w-full max-w-screen-2xl px-4 sm:px-8">
      <button
        onClick={() => scrollByAmount(-1)}
        aria-label="Scroll left"
        className="absolute left-3 top-[38%] z-20 hidden -translate-y-1/2 rounded-full bg-black/70 p-2 text-white shadow-lg backdrop-blur transition hover:bg-black/90 disabled:pointer-events-none disabled:opacity-0 sm:group-hover:flex"
        disabled={atStart}
      >
        <HiChevronLeft className="h-7 w-7" />
      </button>
      <button
        onClick={() => scrollByAmount(1)}
        aria-label="Scroll right"
        className="absolute right-3 top-[38%] z-20 hidden -translate-y-1/2 rounded-full bg-black/70 p-2 text-white shadow-lg backdrop-blur transition hover:bg-black/90 disabled:pointer-events-none disabled:opacity-0 sm:group-hover:flex"
        disabled={atEnd}
      >
        <HiChevronRight className="h-7 w-7" />
      </button>
      <div
        ref={scroller}
        onScroll={updateEdges}
        className="hide-scrollbar edge-fade-x flex snap-x gap-4 overflow-x-auto scroll-smooth pb-2"
      >
        {movieCards}
      </div>
    </div>
  )
}

export default Carousel
