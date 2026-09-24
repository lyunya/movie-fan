import type { Metadata } from 'next'

import PassportClient from './PassportClient'

export const metadata: Metadata = {
  title: 'Film passport',
  description:
    'Collect a stamp for every decade and genre you watch. How well-traveled is your taste?',
}

export default function PassportPage() {
  return <PassportClient />
}
