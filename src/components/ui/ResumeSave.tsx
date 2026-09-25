'use client'
import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { api } from '@/utils/api'
import { notify } from './Feedback'
export default function ResumeSave() {
  const { status } = useSession(),
    handled = useRef(false),
    utils = api.useUtils()
  const save = api.movie.quickAdd.useMutation({
    onSuccess: () => {
      utils.user.query.invalidate()
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
      const id = sessionStorage.getItem('movie-fan-pending-save')
      if (id) {
        sessionStorage.removeItem('movie-fan-pending-save')
        if (/^\d+$/.test(id)) mutate({ movieId: id })
      }
    } catch {}
  }, [status, mutate])
  return null
}
