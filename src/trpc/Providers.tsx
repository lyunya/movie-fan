'use client'

import { useMemo, useState, type ReactNode } from 'react'
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { httpBatchLink, loggerLink, splitLink } from '@trpc/client'
import type { Session } from 'next-auth'
import { SessionContext, type SessionContextValue } from 'next-auth/react'
import superjson from 'superjson'

import { api } from '@/utils/api'

const SLOW_READS =
  /^(availability\.(upNext|library)|catalog\.(forYou|tonight))$/

export default function Providers({ children }: { children: ReactNode }) {
  // Every refetch is a serverless invocation, so be deliberate: data stays
  // fresh for a minute and tabbing back to the site doesn't refetch every
  // active query (react-query's default). Mutations still invalidate.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )
  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === 'development' ||
            (op.direction === 'down' && op.result instanceof Error),
        }),
        // A batch answers only when its slowest call does. Keep the calls
        // that wait on the film database (up to 50 availability checks, the
        // "For you" lookups) out of the batch that carries the Library index,
        // so bookmarks and the watchlist row never wait on them.
        splitLink({
          condition: (op) => SLOW_READS.test(op.path),
          true: httpBatchLink({ url: '/api/trpc', transformer: superjson }),
          false: httpBatchLink({ url: '/api/trpc', transformer: superjson }),
        }),
      ],
    })
  )

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SessionSource>{children}</SessionSource>
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </api.Provider>
  )
}

/**
 * Feeds `useSession()` from one request per page load.
 *
 * Auth.js's own SessionProvider asks for the session, announces that to
 * other tabs, hears its own announcement, and asks again: two function
 * invocations on every page view, guests included. This keeps the same
 * `useSession()` contract with a single cached request. Signing in or out
 * navigates, which loads a fresh session; other tabs catch up on their next
 * page load.
 */
function SessionSource({ children }: { children: ReactNode }) {
  const { data, isPending, refetch } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async (): Promise<Session | null> => {
      const res = await fetch('/api/auth/session', {
        credentials: 'same-origin',
      })
      if (!res.ok) throw new Error(`Session request failed (${res.status})`)
      const session = (await res.json()) as Session | null
      return session?.user ? session : null
    },
    staleTime: 5 * 60_000,
    retry: 1,
  })
  const value = useMemo(
    () =>
      ({
        data: data ?? null,
        status: isPending
          ? 'loading'
          : data
            ? 'authenticated'
            : 'unauthenticated',
        update: async () => (await refetch()).data ?? null,
      }) as SessionContextValue,
    [data, isPending, refetch]
  )
  // Auth.js guards createContext for server builds; it always exists here
  const Provider = SessionContext!.Provider
  return <Provider value={value}>{children}</Provider>
}
