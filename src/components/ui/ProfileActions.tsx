'use client'
import { signIn, useSession } from 'next-auth/react'
import { api } from '@/utils/api'
import { notify } from './Feedback'
export default function ProfileActions({ userId }: { userId: string }) {
  const { data: session } = useSession(),
    utils = api.useUtils()
  const connections = api.social.connections.useQuery(undefined, {
    enabled: !!session,
  })
  const connect = api.social.connect.useMutation({
    onSuccess: () => utils.social.invalidate(),
    onError: (e) => notify(e.message, 'error'),
  })
  if (session?.user?.id === userId) return null
  const following = connections.data?.some(
    (c) => c.targetId === userId && c.kind === 'FOLLOW'
  )
  return (
    <button
      className="btn-ghost"
      disabled={connect.isPending || (!!session && connections.isLoading)}
      onClick={() =>
        session
          ? connect.mutate({
              targetId: userId,
              kind: 'FOLLOW',
              enabled: !following,
            })
          : signIn()
      }
    >
      {following ? 'Following ✓' : 'Follow this film fan'}
    </button>
  )
}
