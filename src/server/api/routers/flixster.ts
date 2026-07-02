import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from './../trpc'
import { env } from '../../../env/server.mjs'
import {
  RAPID_API_HOST,
  FLIXSTER_API_SEARCH_URL,
  FLIXSTER_API_MOVIE_DETAILS_URL,
} from '@/data/Constants'

const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': env.RAPID_API_KEY,
    'X-RapidAPI-Host': RAPID_API_HOST,
  },
}

const fetchFlixster = async (url: string) => {
  const res = await fetch(url, options)
  if (!res.ok) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Flixster request failed with status ${res.status}`,
    })
  }
  return res.json()
}

export const flixsterRouter = createTRPCRouter({
  search: publicProcedure
    .input(z.object({ query: z.string().trim().min(1) }))
    .query(async ({ input }) => {
      const data = await fetchFlixster(
        `${FLIXSTER_API_SEARCH_URL}${encodeURIComponent(input.query)}`
      )
      return { movies: data?.data?.search?.movies ?? [] }
    }),
  details: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const data = await fetchFlixster(
        `${FLIXSTER_API_MOVIE_DETAILS_URL}${encodeURIComponent(input.id)}`
      )
      return { movie: data?.data?.movie ?? null }
    }),
})
