import type { Metadata } from 'next'

import DiaryClient from './DiaryClient'

export const metadata: Metadata = {
  title: 'Movie diary',
  description: 'Every movie night, review, rating, and rewatch in one place.',
}

export default function DiaryPage() {
  return <DiaryClient />
}
