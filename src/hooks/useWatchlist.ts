'use client'

/**
 * Session-aware watchlist state shared by movie cards and the hero.
 * Exposes membership lookups plus a one-click toggle backed by the
 * movie.quickAdd / movie.delete mutations. Signed-out users are sent
 * to the sign-in flow instead.
 */
import { useSession, signIn } from 'next-auth/react'
import { api } from '@/utils/api'

export const useWatchlist = () => {
  const { data: session } = useSession()
  const utils = api.useUtils()

  const watchlist = api.user.query.useQuery(undefined, {
    enabled: !!session,
    staleTime: 30_000,
  })

  const invalidate = () => {
    utils.user.query.invalidate()
    utils.movie.query.invalidate()
  }

  const quickAdd = api.movie.quickAdd.useMutation({ onSuccess: invalidate })
  const remove = api.movie.delete.useMutation({ onSuccess: invalidate })

  const ids = new Set(
    (watchlist.data?.movies ?? []).map((movie) => movie.movieId)
  )

  const has = (movieId: string) => ids.has(movieId)

  const toggle = (movieId: string) => {
    if (!session) {
      signIn()
      return
    }
    if (has(movieId)) {
      remove.mutate({ movieId })
    } else {
      quickAdd.mutate({ movieId })
    }
  }

  return {
    isSignedIn: !!session,
    has,
    toggle,
    // Lets a card show a spinner only for the movie actually being toggled
    pendingId: quickAdd.isPending
      ? quickAdd.variables?.movieId
      : remove.isPending
        ? remove.variables?.movieId
        : null,
  }
}
