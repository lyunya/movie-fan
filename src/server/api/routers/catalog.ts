import { z } from 'zod'
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from './../trpc'
import { catalog } from '@/server/catalog'
import { library } from '@/server/library'
import { recommendations } from '@/server/recommendations'

const region = z.string().regex(/^[A-Z]{2}$/)

export const catalogRouter = createTRPCRouter({
  availability: publicProcedure
    .input(z.object({ movieId: z.string().regex(/^\d+$/), region }))
    .query(({ input }) => catalog.whereToWatch(input.movieId, input.region)),

  providers: publicProcedure
    .input(z.object({ region: z.string().trim().length(2).default('US') }))
    .query(({ input }) => catalog.providers(input.region.toUpperCase())),

  tonight: publicProcedure
    .input(
      z.object({
        genreIds: z.array(z.number().int().positive()).max(8).default([]),
        maxRuntime: z.number().int().min(60).max(300).optional(),
        minScore: z.number().int().min(0).max(100).default(60),
        surprise: z.number().int().min(0).max(19).default(0),
        region: region.optional(),
        providerIds: z.array(z.number().int().positive()).max(20).optional(),
        excludeIds: z.array(z.string()).max(200).default([]),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id
      const [member, entries] = userId
        ? await Promise.all([
            ctx.prisma.user.findUnique({
              where: { id: userId },
              select: { watchRegion: true, preferredProviders: true },
            }),
            library.forMember(userId).entries(),
          ])
        : [null, []]
      const watchRegion = input.region || member?.watchRegion || 'US',
        providerIds = input.providerIds || member?.preferredProviders || []
      const picks = await recommendations.pickTonight({
        library: entries,
        excludeIds: input.excludeIds,
        filters: {
          genreIds: input.genreIds,
          maxRuntime: input.maxRuntime,
          minScore: input.minScore,
          region: watchRegion,
          streamingOn: providerIds.length ? providerIds : undefined,
          surprise: input.surprise,
        },
      })
      return {
        films: picks.map((p) => p.film),
        roles: picks.map((p) => p.role),
        reasons: picks.map((p) => p.reason),
        usingProviders: providerIds.length > 0,
        region: watchRegion,
      }
    }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string().trim().min(1),
        page: z.number().int().min(1).max(500).default(1),
      })
    )
    .query(({ input }) => catalog.search(input.query, input.page)),

  details: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => ({ film: await catalog.filmDetail(input.id) })),

  discoverByGenre: publicProcedure
    .input(
      z.object({
        genreId: z.number().int().positive(),
        page: z.number().int().min(1).max(500).default(1),
        maxRuntime: z.number().int().min(1).max(300).optional(),
        decade: z.number().int().min(1900).max(2200).optional(),
        region: region.optional(),
        providerIds: z.array(z.number().int().positive()).max(20).optional(),
        streaming: z.boolean().optional(),
      })
    )
    .query(({ input }) =>
      catalog.discover({
        genreIds: [input.genreId],
        page: input.page,
        maxRuntime: input.maxRuntime,
        decade: input.decade,
        region: input.region,
        streamingOn: input.streaming ? (input.providerIds ?? []) : undefined,
      })
    ),

  /** Personalized row: popular films in the Member's strongest genres. */
  forYou: protectedProcedure.query(async ({ ctx }) =>
    recommendations.forYou({
      library: await library.forMember(ctx.session.user.id).entries(),
    })
  ),
})
