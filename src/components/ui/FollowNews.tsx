'use client'
import { signIn, useSession } from 'next-auth/react'
import { api } from '@/utils/api'
import { notify } from './Feedback'
export default function FollowNews({ subject }: { subject: string }) {
  const { data: session } = useSession(),
    utils = api.useUtils()
  const prefs = api.member.preferences.useQuery(undefined, {
    enabled: !!session,
  })
  const save = api.member.setNewsTopics.useMutation({
    onSuccess: () => {
      void utils.member.preferences.invalidate()
      notify('Your news follows are updated')
    },
    onError: (e) => notify(e.message, 'error'),
  })
  const topics = prefs.data?.newsTopics || []
  const following = topics.includes(subject)
  if (subject.length < 2 || subject.length > 80) return null
  return (
    <button
      className="btn-ghost !text-sm"
      aria-pressed={following}
      disabled={save.isPending || (!!session && prefs.isLoading)}
      onClick={() =>
        session
          ? save.mutate({
              newsTopics: following
                ? topics.filter((t) => t !== subject)
                : [...new Set([...topics, subject])],
              mutedNewsTopics: prefs.data?.mutedNewsTopics || [],
            })
          : signIn()
      }
    >
      {following ? 'Following in News ✓' : 'Follow in News'}
    </button>
  )
}
