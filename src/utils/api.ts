/**
 * Client-side entrypoint for the tRPC API. `api` holds the typesafe
 * React Query hooks; the provider is wired up in src/trpc/Providers.tsx.
 */
import { createTRPCReact } from '@trpc/react-query'
import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server'

import { type AppRouter } from '@/server/api/root'

export const api = createTRPCReact<AppRouter>()

/** Inference helper for inputs: RouterInputs['movie']['create'] */
export type RouterInputs = inferRouterInputs<AppRouter>
/** Inference helper for outputs: RouterOutputs['flixster']['details'] */
export type RouterOutputs = inferRouterOutputs<AppRouter>
