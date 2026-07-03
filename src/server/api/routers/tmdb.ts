import { z } from 'zod'
import { createTRPCRouter, publicProcedure, protectedProcedure } from './../trpc'
import {
  fetchSearch,
  fetchMovieDetails,
  fetchGenre,
  fetchGenreList,
  fetchDiscoverByGenres,
  fetchTrending,
} from '../../tmdb'

const FOR_YOU_LIMIT = 20

export const tmdbRouter = createTRPCRouter({
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
      })
    )
    .query(async ({ input }) => {
      return fetchGenre(input.genreId, input.page)
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
      select: { movieId: true, genres: true },
    })
    if (rows.length === 0) return { movies: [], topGenre: null }

    const counts = new Map<string, number>()
    for (const row of rows) {
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
