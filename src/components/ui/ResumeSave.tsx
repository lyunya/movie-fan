'use client'
import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { api } from '@/utils/api'
import { PENDING_SAVE_KEY } from '@/hooks/useLibrary'
import { notify } from './Feedback'

/** Finishes a save a Member started before signing in. */
export default function ResumeSave() {
  const { status } = useSession(),
    handled = useRef(false),
    utils = api.useUtils()
  const save = api.library.change.useMutation({
    onSuccess: () => {
      void utils.library.invalidate()
      notify('Film saved to your watchlist')
    },
    onError: () =>
      notify('Could not finish saving that film. Please try again.', 'error'),
  })
  const mutate = save.mutate
  useEffect(() => {
    if (status !== 'authenticated' || handled.current) return
    handled.current = true
    try {
      const id = sessionStorage.getItem(PENDING_SAVE_KEY)
      if (id) {
        sessionStorage.removeItem(PENDING_SAVE_KEY)
        if (/^[1-9]\d*$/.test(id))
          mutate({ filmId: id, action: { type: 'save' } })
      }
    } catch {}
  }, [status, mutate])
  return null
}
