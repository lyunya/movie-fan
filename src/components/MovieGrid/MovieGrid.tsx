import type { ReactNode } from 'react'

export default function MovieGrid({ movieCards }: { movieCards: ReactNode[] }) {
  return (
    <div className="mx-auto flex w-full max-w-screen-xl flex-wrap justify-center gap-x-4 gap-y-8">
      {movieCards}
    </div>
  )
}
