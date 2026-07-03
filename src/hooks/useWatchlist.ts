'use client'

/**
 * Session-aware watchlist state shared by movie cards and the hero.
 * Exposes membership lookups plus a one-click toggle backed by the
 * movie.quickAdd / movie.delete mutations. Signed-out users are sent
 * to the sign-in flow instead.
 */
import { useSession, signIn } from 'next-auth/react'
import type { WatchListItem } from '@prisma/client'
import { api } from '@/utils/api'

// A placeholder row inserted into the cache while an add is in flight. Only
// its movieId is read (membership lookups); it's never rendered as a card on
// pages that can add (home/movie/search/genre), and it's replaced by the real
// row on refetch.
const optimisticRow = (movieId: string): WatchListItem => ({
  id: `optimistic-${movieId}`,
  userId: '',
  movieId,
  emsVersionId: movieId,
  directedBy: '',
  durationMinutes: 0,
  name: '',
  posterImage: null,
  genres: [],
  synopsis: null,
  tomatoMeter: null,
  consensus: null,
  totalGross: null,
  releaseDate: null,
  motionPictureRating: null,
  userRating: null,
  hasStreaming: false,
})

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

  // Optimistic toggle: flip the cached membership immediately, roll back on
  // error, and reconcile with the server on settle. has() reads this cache,
  // so every visible card/hero updates the instant the heart is tapped.
  const quickAdd = api.movie.quickAdd.useMutation({
    onMutate: async ({ movieId }) => {
      await utils.user.query.cancel()
      const prev = utils.user.query.getData()
      utils.user.query.setData(undefined, (old) => {
        if (!old) return old
        if (old.movies.some((m) => m.movieId === movieId)) return old
        return { ...old, movies: [...old.movies, optimisticRow(movieId)] }
      })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.user.query.setData(undefined, ctx.prev)
    },
    onSettled: invalidate,
  })
  const remove = api.movie.delete.useMutation({
    onMutate: async ({ movieId }) => {
      await utils.user.query.cancel()
      const prev = utils.user.query.getData()
      utils.user.query.setData(undefined, (old) =>
        old
          ? { ...old, movies: old.movies.filter((m) => m.movieId !== movieId) }
          : old
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.user.query.setData(undefined, ctx.prev)
    },
    onSettled: invalidate,
  })

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
