'use client'
import Link from 'next/link'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import { api } from '@/utils/api'
import ProfileSettings from '@/components/ProfileSettings/ProfileSettings'
import { notify, QueryError } from '@/components/ui/Feedback'
import Dialog from '@/components/ui/Dialog'
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
  const save = api.member.updateProfile.useMutation({
    onSuccess: () => {
      void utils.member.profile.invalidate()
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
function DeleteAccount() {
  const [open, setOpen] = useState(false),
    [typed, setTyped] = useState('')
  const remove = api.member.deleteAccount.useMutation({
    onSuccess: () => signOut({ callbackUrl: '/' }),
    onError: () =>
      notify(
        'Your account could not be deleted. Nothing was removed.',
        'error'
      ),
  })
  const close = () => {
    setOpen(false)
    setTyped('')
  }
  return (
    <section className="surface mt-10 border-red-900/60 p-5">
      <h2 className="text-xl font-semibold">Delete your account</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Removes your library, ratings, diary, lists, follows and profile for
        good. To keep a copy first, export your library from{' '}
        <Link className="text-pink-300 underline" href="/library">
          Your library
        </Link>{' '}
        and your diary from{' '}
        <Link className="text-pink-300 underline" href="/diary">
          Diary
        </Link>
        .
      </p>
      <button
        className="btn-ghost mt-4 !border-red-800 !text-red-200"
        onClick={() => setOpen(true)}
      >
        Delete account…
      </button>
      <Dialog open={open} onClose={close} title="Delete your account?">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (typed === 'DELETE') remove.mutate({ confirm: 'DELETE' })
          }}
        >
          <p className="text-sm text-zinc-300">
            This can’t be undone. Everything you’ve saved, rated, logged and
            listed will be permanently removed.
          </p>
          <label className="field-label">
            Type DELETE to confirm
            <input
              className="field"
              autoComplete="off"
              autoCapitalize="characters"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              className="btn-brand !bg-red-700 !bg-none"
              disabled={typed !== 'DELETE' || remove.isPending}
            >
              {remove.isPending ? 'Deleting…' : 'Delete everything'}
            </button>
            <button type="button" className="btn-ghost" onClick={close}>
              Keep my account
            </button>
          </div>
        </form>
      </Dialog>
    </section>
  )
}
export default function Profile() {
  const { status } = useSession(),
    query = api.member.profile.useQuery(undefined, {
      enabled: status === 'authenticated',
    }),
    prefs = api.member.preferences.useQuery(undefined, {
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
  const user = query.data
  return (
    <main className="page-shell max-w-3xl">
      <p className="eyebrow">Your corner of the club</p>
      <h1 className="mb-6 mt-2 text-4xl font-semibold">Profile & settings</h1>
      <Link href="/library" className="mb-6 inline-block text-pink-300">
        ← Your library
      </Link>
      {query.isError ? (
        <QueryError retry={() => query.refetch()} />
      ) : user && prefs.data ? (
        <>
          <Identity
            name={user.name || ''}
            handle={user.handle || ''}
            bio={user.bio || ''}
          />
          <ProfileSettings
            userId={user.id}
            handle={user.handle}
            isPublic={user.isPublic}
            alertsEnabled={user.streamAlerts}
            watchRegion={prefs.data.region}
            preferredProviders={prefs.data.services}
          />
          {user.isPublic && (
            <Link
              prefetch={false}
              className="btn-ghost"
              href={`/u/${user.handle || user.id}`}
            >
              Preview your public profile
            </Link>
          )}
          <DeleteAccount />
        </>
      ) : (
        <div className="surface h-72 animate-pulse" />
      )}
    </main>
  )
}
