import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from './../trpc'
import { REGION_CODES } from '@/server/availability/regions'
import { members } from '@/server/member'

const me = (ctx: { session: { user: { id: string } } }) =>
  members.forMember(ctx.session.user.id)

export const memberRouter = createTRPCRouter({
  preferences: protectedProcedure.query(({ ctx }) => me(ctx).preferences()),
  profile: protectedProcedure.query(({ ctx }) => me(ctx).profile()),

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
    .mutation(({ ctx, input }) => me(ctx).updateProfile(input)),

  /** The read-only public profile at /u/<handle> */
  setPublic: protectedProcedure
    .input(z.object({ public: z.boolean() }))
    .mutation(({ ctx, input }) => me(ctx).setPublic(input.public)),

  /** "Now streaming" email alerts for the Watchlist */
  setStreamAlerts: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(({ ctx, input }) => me(ctx).setStreamAlerts(input.enabled)),

  setStreaming: protectedProcedure
    .input(
      z.object({
        region: z.enum(REGION_CODES),
        services: z.array(z.number().int().positive()).max(20),
      })
    )
    .mutation(({ ctx, input }) => me(ctx).setStreaming(input)),

  setNewsTopics: protectedProcedure
    .input(
      z.object({
        newsTopics: z.array(z.string().trim().min(2).max(80)).max(30),
        mutedNewsTopics: z.array(z.string().max(80)).max(20),
      })
    )
    .mutation(({ ctx, input }) => me(ctx).setNewsTopics(input)),
})
