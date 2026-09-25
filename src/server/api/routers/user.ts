import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from './../trpc'
import { REGION_CODES } from '@/server/availability/regions'

export const UserRouter = createTRPCRouter({
  query: protectedProcedure.query(async ({ ctx }) => {
    const { prisma, session } = ctx
    const userIdNum = session?.user?.id

    const user = await prisma.user.findUnique({
      where: {
        id: userIdNum,
      },
    })
    // Library data comes from the library router (index, entries)
    return { user }
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(80),
        bio: z.string().trim().max(280),
        handle: z
          .string()
          .trim()
          .toLowerCase()
          .regex(
            /^[a-z0-9_]{3,24}$/,
            'Use 3–24 letters, numbers or underscores.'
          ),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      })
    ),
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

  setStreamingPreferences: protectedProcedure
    .input(
      z.object({
        watchRegion: z.enum(REGION_CODES),
        preferredProviders: z.array(z.number().int().positive()).max(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      })
    }),
})
