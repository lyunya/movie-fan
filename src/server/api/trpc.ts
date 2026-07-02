/**
 * tRPC server setup for the App Router. The context reads the session via
 * Auth.js `auth()` (no req/res needed), so it works from the fetch route
 * handler and from server callers alike.
 */
import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'

import { auth } from '../auth'
import { prisma } from '../db'

export const createTRPCContext = async () => {
  const session = await auth()
  return { session, prisma }
}

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    transformer: superjson,
    errorFormatter({ shape }) {
      return shape
    },
  })

export const createTRPCRouter = t.router

/** Public (unauthed) procedure. */
export const publicProcedure = t.procedure

/** Middleware that enforces a logged-in user. */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

/** Protected (authed) procedure. */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)
