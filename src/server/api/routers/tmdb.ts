import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from './../trpc'
import { fetchSearch, fetchMovieDetails, fetchGenre } from '../../tmdb'

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
})
