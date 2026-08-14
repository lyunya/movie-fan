import type { Metadata } from 'next'

import VotingRoomClient from './VotingRoomClient'

export const metadata: Metadata = {
  title: 'Vote on movie night',
  robots: { index: false },
}

export default async function VotingRoomPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  return <VotingRoomClient code={code} />
}
