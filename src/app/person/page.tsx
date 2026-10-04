import type { Metadata } from 'next'
import { Suspense } from 'react'
import PersonProfile, { PersonLoading } from './PersonProfile'

export const metadata: Metadata = {
  title: 'Person',
  description: 'Explore a filmography on Movie Fan.',
  robots: { index: false, follow: false },
}

// All /person/<slug> URLs rewrite to this one static shell. Do not read params,
// searchParams, cookies, or catalog data on the server here: that would turn
// crawling the unbounded person graph back into metered function renders or
// per-URL ISR writes. Only an active browser requests the profile through tRPC.
export default function PersonPage() {
  return (
    <Suspense fallback={<PersonLoading />}>
      <PersonProfile />
    </Suspense>
  )
}
