import type { Metadata } from 'next'

import ListsClient from './ListsClient'

export const metadata: Metadata = {
  title: 'My movie lists',
  description: 'Create and share collections for every kind of movie night.',
}

export default function ListsPage() {
  return <ListsClient />
}
