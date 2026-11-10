import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { type NextRequest } from 'next/server'

import { publicCacheSeconds } from '@/server/api/publicReads'
import { appRouter } from '@/server/api/root'
import { createTRPCContext } from '@/server/api/trpc'

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: ({ info }) =>
      createTRPCContext({
        skipSession:
          publicCacheSeconds(info.calls.map((call) => call.path)) !== null,
      }),
    responseMeta({ paths, type, errors }) {
      const seconds =
        type === 'query' && !errors.length
          ? publicCacheSeconds(paths ?? [])
          : null
      if (seconds === null) return {}
      // Shared caches only: browsers keep using react-query's own freshness
      return {
        headers: new Headers({
          'Cache-Control': `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${seconds}`,
        }),
      }
    },
  })

export { handler as GET, handler as POST }
