import type { Metadata } from 'next'
import { Suspense } from 'react'

import YearRecapClient from './YearRecapClient'

export const metadata: Metadata = {
  title: 'Your year in movies',
  description: 'Your movie-watching year, wrapped up.',
}

export default function YearPage() {
  return (
    <Suspense fallback={<div className="min-h-[65vh]" />}>
      <YearRecapClient />
    </Suspense>
  )
}
