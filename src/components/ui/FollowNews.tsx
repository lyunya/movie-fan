'use client'
import { signIn, useSession } from 'next-auth/react'
import { api } from '@/utils/api'
import { notify } from './Feedback'
export default function FollowNews({ subject }: { subject: string }) {
  const { data: session } = useSession(),
    utils = api.useUtils()
  const user = api.user.query.useQuery(undefined, { enabled: !!session })
  const save = api.news.preferences.useMutation({
    onSuccess: () => {
      utils.user.query.invalidate()
      notify('Your news follows are updated')
    },
    onError: (e) => notify(e.message, 'error'),
  })
  const topics = user.data?.user?.newsTopics || []
  const following = topics.includes(subject)
  if (subject.length < 2 || subject.length > 80) return null
  return (
    <button
      className="btn-ghost !text-sm"
      aria-pressed={following}
      disabled={save.isPending || (!!session && user.isLoading)}
      onClick={() =>
        session
          ? save.mutate({
              newsTopics: following
                ? topics.filter((t) => t !== subject)
                : [...new Set([...topics, subject])],
              mutedNewsTopics: user.data?.user?.mutedNewsTopics || [],
            })
          : signIn()
      }
    >
      {following ? 'Following in News ✓' : 'Follow in News'}
    </button>
  )
}
