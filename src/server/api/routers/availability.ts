import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'
import { availability, REGION_CODES } from '@/server/availability'
import { library } from '@/server/library'
import { members } from '@/server/member'

const PAGE = 50
const SHELF = 6

const prefsFor = (ctx: { session: { user: { id: string } } }) =>
  members.forMember(ctx.session.user.id).preferences()

export const availabilityRouter = createTRPCRouter({
  /** Every way to watch one Film in a Region. */
  whereToWatch: publicProcedure
    .input(
      z.object({
        filmId: z.string().regex(/^\d+$/),
        region: z.enum(REGION_CODES),
      })
    )
    .query(({ input }) =>
      availability.whereToWatch(input.filmId, input.region)
    ),

  /** A page of the Member's Library, checked for what they can stream. */
  library: protectedProcedure
    .input(z.object({ cursor: z.number().int().min(0).nullish() }))
    .query(async ({ ctx, input }) => {
      const prefs = await prefsFor(ctx)
      const offset = input.cursor || 0
      const ids = (await library.forMember(ctx.session.user.id).entries())
        .sort(
          (a, b) =>
            (b.savedAt?.getTime() ?? 0) - (a.savedAt?.getTime() ?? 0) ||
            a.filmId.localeCompare(b.filmId)
        )
        .map((e) => e.filmId)
      const page = ids.slice(offset, offset + PAGE)
      const result = await availability.streamingFor(page, prefs)
      return {
        ...result,
        region: prefs.region,
        nextCursor: ids.length > offset + PAGE ? offset + PAGE : undefined,
      }
    }),

  /** Up-next Films the Member can stream tonight, for the home shelf. */
  upNext: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await prefsFor(ctx)
    const entries = await library.forMember(ctx.session.user.id).upNext(50)
    const { available } = await availability.streamingFor(
      entries.map((e) => e.filmId),
      prefs,
      { want: SHELF }
    )
    const byId = new Map(entries.map((e) => [e.filmId, e]))
    return {
      region: prefs.region,
      films: available.map((a) => ({
        ...byId.get(a.filmId)!,
        services: a.services,
      })),
    }
  }),
})
