import type { Metadata } from 'next'

import RoomsClient from './RoomsClient'

export const metadata: Metadata = {
  title: 'Movie night rooms',
  description:
    'Invite friends, vote privately, and reveal the movies everyone wants to watch.',
}

export default function RoomsPage() {
  return <RoomsClient />
}
