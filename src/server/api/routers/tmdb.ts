import { z } from 'zod'
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from './../trpc'
import {
  fetchSearch,
  fetchMovieDetails,
  fetchGenre,
  fetchGenreList,
  fetchDiscoverByGenres,
  fetchTrending,
  fetchTonightChoices,
  fetchWatchProviders,
  fetchMovieAvailability,
} from '../../tmdb'

const FOR_YOU_LIMIT = 20
import { selectTonightPicks } from '@/utils/tonightPicks'

export const tmdbRouter = createTRPCRouter({
  availability: publicProcedure
    .input(
      z.object({ movieId: z.string(), region: z.string().regex(/^[A-Z]{2}$/) })
    )
    .query(async ({ input }) => {
      return fetchMovieAvailability(input.movieId, input.region)
    }),
  providers: publicProcedure
    .input(z.object({ region: z.string().trim().length(2).default('US') }))
    .query(({ input }) => fetchWatchProviders(input.region.toUpperCase())),

  tonight: publicProcedure
    .input(
      z.object({
        genreIds: z.array(z.number().int().positive()).max(8).default([]),
        maxRuntime: z.number().int().min(60).max(300).optional(),
        minScore: z.number().int().min(0).max(100).default(60),
        surprise: z.number().int().min(0).max(19).default(0),
        region: z
          .string()
          .regex(/^[A-Z]{2}$/)
          .optional(),
        providerIds: z.array(z.number().int().positive()).max(20).optional(),
        excludeIds: z.array(z.string()).max(200).default([]),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id
      const [user, watched] = userId
        ? await Promise.all([
            ctx.prisma.user.findUnique({
              where: { id: userId },
              select: { watchRegion: true, preferredProviders: true },
            }),
            ctx.prisma.watchListItem.findMany({
              where: { userId },
              select: {
                movieId: true,
                watched: true,
                dismissed: true,
                userRating: true,
                favorite: true,
                genres: true,
              },
            }),
          ])
        : [null, []]
      const region = input.region || user?.watchRegion || 'US',
        providerIds = input.providerIds || user?.preferredProviders || []
      const movies = await fetchTonightChoices({
        region,
        providerIds,
        genreIds: input.genreIds,
        maxRuntime: input.maxRuntime,
        minScore: input.minScore,
        page: 1 + input.surprise,
      })
      const excluded = new Set([
        ...watched
          .filter((m) => m.watched || m.dismissed)
          .map((m) => m.movieId),
        ...input.excludeIds,
      ])
      const eligible = movies.filter((m) => !excluded.has(m.emsVersionId))
      const lovedGenres = new Set(
        watched
          .filter(
            (m) => !m.dismissed && (m.favorite || (m.userRating || 0) >= 4)
          )
          .flatMap((m) => m.genres)
      )
      const genres = lovedGenres.size
        ? await fetchGenreList().catch(() => [])
        : []
      const picks = selectTonightPicks(
        eligible,
        genres.filter((g) => lovedGenres.has(g.name)).map((g) => g.id)
      )
      const chosen = picks.map((p) => p.movie)
      return {
        movies: chosen,
        usingProviders: providerIds.length > 0,
        region,
        roles: picks.map((p) => p.role),
        reasons: picks.map(
          (p) =>
            `${p.reason}. ${input.maxRuntime ? `Up to ${input.maxRuntime} minutes · ` : ''}${providerIds.length ? 'On your selected services' : 'Matches your filters'} · TMDB ${input.minScore}% or higher`
        ),
      }
    }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string().trim().min(1),
        page: z.number().int().min(1).max(500).default(1),
      })
    )
    .query(async ({ input }) => {
      return fetchSearch(input.query, input.page)
    }),
  details: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      return { movie: await fetchMovieDetails(input.id) }
    }),
  discoverByGenre: publicProcedure
    .input(
      z.object({
        genreId: z.number().int().positive(),
        page: z.number().int().min(1).max(500).default(1),
        maxRuntime: z.number().int().min(1).max(300).optional(),
        decade: z.number().int().min(1900).max(2200).optional(),
        region: z
          .string()
          .regex(/^[A-Z]{2}$/)
          .optional(),
        providerIds: z.array(z.number().int().positive()).max(20).optional(),
        streaming: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      return fetchGenre(input.genreId, input.page, input)
    }),
  trending: publicProcedure
    .input(z.object({ window: z.enum(['day', 'week']) }))
    .query(async ({ input }) => {
      return { movies: await fetchTrending(input.window) }
    }),
  /**
   * Personalized row: pick the user's two most-saved genres and return
   * popular movies in them that aren't already on their watchlist.
   */
  forYou: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.prisma.watchListItem.findMany({
      where: { userId: ctx.session.user.id },
      select: {
        movieId: true,
        genres: true,
        userRating: true,
        favorite: true,
        dismissed: true,
      },
    })
    if (rows.length === 0) return { movies: [], topGenre: null }

    const counts = new Map<string, number>()
    for (const row of rows.filter(
      (r) =>
        !r.dismissed &&
        (r.userRating == null || r.userRating >= 3 || r.favorite)
    )) {
      for (const genre of row.genres || []) {
        counts.set(genre, (counts.get(genre) || 0) + 1)
      }
    }
    const rankedNames = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
    if (rankedNames.length === 0) return { movies: [], topGenre: null }

    const genreList = await fetchGenreList().catch(() => [])
    const nameToId = new Map(
      genreList.map((genre) => [genre.name.toLowerCase(), genre.id])
    )
    const topNames = rankedNames.filter((name) =>
      nameToId.has(name.toLowerCase())
    )
    const topIds = topNames
      .slice(0, 2)
      .map((name) => nameToId.get(name.toLowerCase()))
      .filter((id): id is number => typeof id === 'number')
    if (topIds.length === 0) return { movies: [], topGenre: null }

    const owned = new Set(rows.map((row) => row.movieId))
    const discovered = await fetchDiscoverByGenres(topIds).catch(() => [])
    const movies = discovered
      .filter((movie) => !owned.has(movie.emsVersionId))
      .slice(0, FOR_YOU_LIMIT)

    return { movies, topGenre: topNames[0] ?? null }
  }),
})
