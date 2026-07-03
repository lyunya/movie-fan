import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from './../trpc'

export const UserRouter = createTRPCRouter({
  query: protectedProcedure.query(async ({ ctx }) => {
    const { prisma, session } = ctx
    const userIdNum = session?.user?.id

    const user = await prisma.user.findUnique({
      where: {
        id: userIdNum,
      },
    })
    const movies = await prisma.watchListItem.findMany({
      where: {
        userId: userIdNum,
      },
    })

    return { user, movies }
  }),

  // Toggle the read-only public watchlist at /u/<id>
  setPublic: protectedProcedure
    .input(z.object({ public: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { publicWatchlist: input.public },
      })
    }),

  // Toggle "now streaming" email alerts for the user's watchlist
  setStreamAlerts: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { streamAlerts: input.enabled },
      })
    }),
})
