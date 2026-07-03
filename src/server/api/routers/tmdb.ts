import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from './../trpc'
import { fetchSearch, fetchMovieDetails } from '../../tmdb'

export const tmdbRouter = createTRPCRouter({
  search: publicProcedure
    .input(z.object({ query: z.string().trim().min(1) }))
    .query(async ({ input }) => {
      return { movies: await fetchSearch(input.query) }
    }),
  details: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      return { movie: await fetchMovieDetails(input.id) }
    }),
})
