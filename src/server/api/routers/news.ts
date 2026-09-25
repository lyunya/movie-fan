import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
export const newsRouter = createTRPCRouter({
  bookmarks: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.newsBookmark.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: 'desc' },
    })
  ),
  bookmark: protectedProcedure
    .input(
      z.object({
        url: z.string().url().startsWith('https://'),
        title: z.string().max(500),
        source: z.string().max(100),
        saved: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) =>
      input.saved
        ? ctx.prisma.newsBookmark.upsert({
            where: {
              userId_url: { userId: ctx.session.user.id, url: input.url },
            },
            create: {
              userId: ctx.session.user.id,
              url: input.url,
              title: input.title,
              source: input.source,
            },
            update: {},
          })
        : ctx.prisma.newsBookmark.deleteMany({
            where: { userId: ctx.session.user.id, url: input.url },
          })
    ),
  preferences: protectedProcedure
    .input(
      z.object({
        newsTopics: z.array(z.string().trim().min(2).max(80)).max(30),
        mutedNewsTopics: z.array(z.string().max(80)).max(20),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      })
    ),
})
