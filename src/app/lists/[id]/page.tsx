import type { Metadata } from 'next'

import SharedListClient from './SharedListClient'

export const metadata: Metadata = {
  title: 'Shared movie list',
  robots: { index: false },
}

export default async function SharedListPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <SharedListClient id={id} />
}
