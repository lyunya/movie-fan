import { Suspense } from 'react'
import LibraryClient from './LibraryClient'
export const metadata = { title: 'Your library' }
export default function Page() {
  return (
    <Suspense>
      <LibraryClient />
    </Suspense>
  )
}
