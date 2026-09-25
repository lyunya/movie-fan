'use client'
/**
 * The signed-in Member's Library on the client: one small index (film ids
 * and flags) shared by every card, button and page, plus `act()` to change
 * an entry.
 *
 * Changes show instantly: the same rules the server enforces are applied to
 * the cached index, then the server's answer replaces it. Actions that take
 * something away offer an Undo that restores the entry exactly.
 * Signed-out Members are sent to sign in (a save resumes afterwards).
 */
import { useMemo } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { notify } from '@/components/ui/Feedback'
import { applyRules, needsEntry } from '@/server/library/rules'
import type {
  EntryChangeAction,
  EntryActionType,
  IndexEntry,
} from '@/server/library/types'
import { api } from '@/utils/api'

export const PENDING_SAVE_KEY = 'movie-fan-pending-save'

const UNDOABLE: Partial<Record<EntryActionType, string>> = {
  unsave: 'Removed from your watchlist. Your rating and history are kept.',
  markUnwatched: 'Marked as not watched',
  clearRating: 'Rating cleared',
  unfavorite: 'Removed from favorites',
  dismiss: 'We’ll leave this out of future picks',
}

export function useLibrary() {
  const { data: session } = useSession()
  const utils = api.useUtils()
  const index = api.library.index.useQuery(undefined, {
    enabled: !!session,
    staleTime: 30_000,
  })
  const byId = useMemo(
    () => new Map((index.data ?? []).map((e) => [e.filmId, e])),
    [index.data]
  )

  const refresh = () =>
    Promise.all([utils.library.invalidate(), utils.diary.invalidate()])
  const patch = (filmId: string, next: IndexEntry | null) =>
    utils.library.index.setData(undefined, (old) =>
      old
        ? [...old.filter((e) => e.filmId !== filmId), ...(next ? [next] : [])]
        : old
    )

  const restore = api.library.restore.useMutation({
    onSuccess: (result) => patch(result.filmId, result.entry),
    onError: () => notify('Could not undo that. Please try again.', 'error'),
    onSettled: refresh,
  })

  const change = api.library.change.useMutation({
    onMutate: async ({ filmId, action }) => {
      await utils.library.index.cancel()
      const current =
        utils.library.index.getData()?.find((e) => e.filmId === filmId) ?? null
      if (current || !needsEntry(action))
        patch(filmId, { filmId, ...applyRules(current, action) })
      return { current }
    },
    onError: (error, { filmId }, context) => {
      // Roll back only this Film, so other in-flight changes stay visible
      if (context) patch(filmId, context.current)
      notify(
        error.data?.code === 'CONFLICT'
          ? error.message
          : 'Could not save your change. Please try again.',
        'error'
      )
    },
    onSuccess: (result, { action }) => {
      patch(result.filmId, result.entry)
      const message = UNDOABLE[action.type]
      const changed = result.previous !== null || result.entry !== null
      if (message && changed)
        notify(message, 'success', () =>
          restore.mutate({ filmId: result.filmId, previous: result.previous })
        )
    },
    onSettled: refresh,
  })

  const get = (filmId: string): IndexEntry | null => byId.get(filmId) ?? null

  const act = (filmId: string, action: EntryChangeAction) => {
    if (!session) {
      if (action.type === 'save')
        try {
          sessionStorage.setItem(PENDING_SAVE_KEY, filmId)
        } catch {}
      void signIn()
      return
    }
    change.mutate({ filmId, action })
  }

  return {
    isSignedIn: !!session,
    entries: index.data ?? [],
    get,
    /** On the Watchlist right now */
    has: (filmId: string) => !!get(filmId)?.inWatchlist,
    act,
    toggleWatchlist: (filmId: string) =>
      act(filmId, { type: get(filmId)?.inWatchlist ? 'unsave' : 'save' }),
    /** The Film whose change is in flight, so only its button shows it */
    pendingId: change.isPending ? change.variables?.filmId : null,
  }
}

/** One Film's entry and the actions for it. */
export function useLibraryEntry(filmId: string) {
  const library = useLibrary()
  return {
    isSignedIn: library.isSignedIn,
    entry: library.get(filmId),
    act: (action: EntryChangeAction) => library.act(filmId, action),
    pending: library.pendingId === filmId,
  }
}
