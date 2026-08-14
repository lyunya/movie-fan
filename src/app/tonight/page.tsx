import type { Metadata } from 'next'

import TonightClient from './TonightClient'

export const metadata: Metadata = {
  title: 'What should I watch tonight?',
  description:
    'Get three personalized movie picks based on your mood, time, ratings, and streaming services.',
}

export default function TonightPage() {
  return <TonightClient />
}
