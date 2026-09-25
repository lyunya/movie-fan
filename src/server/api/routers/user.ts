import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from './../trpc'
import { catalog } from '@/server/catalog'

export const UserRouter = createTRPCRouter({
  libraryAvailability: protectedProcedure
    .input(z.object({ cursor: z.number().int().min(0).nullish() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const user = await ctx.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { watchRegion: true, preferredProviders: true },
      })
      const offset = input.cursor || 0
      const rows = await ctx.prisma.watchListItem.findMany({
        where: { userId },
        orderBy: [{ savedAt: 'desc' }, { id: 'asc' }],
        skip: offset,
        take: 51,
        select: { movieId: true },
      })
      const available: { movieId: string; services: string[] }[] = [],
        failed: string[] = []
      const batch = rows.slice(0, 50)
      let index = 0
      await Promise.all(
        Array.from({ length: Math.min(5, batch.length) }, async () => {
          while (index < batch.length) {
            const movie = batch[index++]!
            try {
              const data = await catalog.whereToWatch(
                movie.movieId,
                user.watchRegion
              )
              const providers = (data?.subscription || []).filter(
                (p) =>
                  !user.preferredProviders.length ||
                  user.preferredProviders.includes(p.id)
              )
              if (providers.length)
                available.push({
                  movieId: movie.movieId,
                  services: providers.map((p) => p.name),
                })
            } catch {
              failed.push(movie.movieId)
            }
          }
        })
      )
      return {
        available,
        failed,
        checked: batch.length,
        region: user.watchRegion,
        nextCursor: rows.length > 50 ? offset + 50 : undefined,
      }
    }),
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
        watchRegion: z
          .string()
          .trim()
          .length(2)
          .transform((value) => value.toUpperCase()),
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
