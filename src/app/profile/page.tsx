'use client'
import Link from 'next/link'
import { signIn, useSession } from 'next-auth/react'
import { useState } from 'react'
import { api } from '@/utils/api'
import ProfileSettings from '@/components/ProfileSettings/ProfileSettings'
import { notify, QueryError } from '@/components/ui/Feedback'
function Identity({
  name,
  handle,
  bio,
}: {
  name: string
  handle: string
  bio: string
}) {
  const [values, setValues] = useState({ name, handle, bio }),
    utils = api.useUtils()
  const save = api.user.updateProfile.useMutation({
    onSuccess: () => {
      utils.user.query.invalidate()
      notify('Profile saved')
    },
    onError: () =>
      notify('Could not save. That handle may already be taken.', 'error'),
  })
  return (
    <form
      className="surface mb-6 space-y-4 p-5"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate(values)
      }}
    >
      <h2 className="text-xl font-semibold">Make yourself at home</h2>
      <label className="field-label">
        Display name
        <input
          className="field"
          required
          maxLength={80}
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
        />
      </label>
      <label className="field-label">
        Handle
        <input
          className="field"
          required
          pattern="[a-z0-9_]{3,24}"
          value={values.handle}
          onChange={(e) =>
            setValues({ ...values, handle: e.target.value.toLowerCase() })
          }
          placeholder="your_name"
        />
      </label>
      <label className="field-label">
        A little about your taste
        <textarea
          className="field"
          maxLength={280}
          value={values.bio}
          onChange={(e) => setValues({ ...values, bio: e.target.value })}
        />
      </label>
      <button className="btn-brand" disabled={save.isPending}>
        Save profile
      </button>
    </form>
  )
}
export default function Profile() {
  const { status } = useSession(),
    query = api.user.query.useQuery(undefined, {
      enabled: status === 'authenticated',
    })
  if (status === 'unauthenticated')
    return (
      <main className="page-shell">
        <h1 className="text-3xl">Your profile</h1>
        <button className="btn-brand mt-5" onClick={() => signIn()}>
          Sign in
        </button>
      </main>
    )
  const user = query.data?.user
  return (
    <main className="page-shell max-w-3xl">
      <p className="eyebrow">Your corner of the club</p>
      <h1 className="mb-6 mt-2 text-4xl font-bold">Profile & settings</h1>
      <Link href="/library" className="mb-6 inline-block text-pink-300">
        ← Your library
      </Link>
      {query.isError ? (
        <QueryError retry={() => query.refetch()} />
      ) : user ? (
        <>
          <Identity
            name={user.name || ''}
            handle={user.handle || ''}
            bio={user.bio || ''}
          />
          <ProfileSettings
            userId={user.id}
            isPublic={user.publicWatchlist}
            alertsEnabled={user.streamAlerts}
            watchRegion={user.watchRegion}
            preferredProviders={user.preferredProviders}
          />
          {user.publicWatchlist && (
            <Link className="btn-ghost" href={`/u/${user.handle || user.id}`}>
              Preview your public profile
            </Link>
          )}
        </>
      ) : (
        <div className="surface h-72 animate-pulse" />
      )}
    </main>
  )
}
