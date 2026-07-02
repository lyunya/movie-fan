import { TRPCError } from '@trpc/server';
import { MovieSchema } from '@/types/MovieSchema';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from './../trpc';

export const watchListItemRouter = createTRPCRouter({
  create: protectedProcedure.input(z.object({
    movieData: MovieSchema
  }))
    .mutation(async ({ ctx, input }) => {
      const { prisma, session } = ctx;
      const userId = session.user.id;
      const { movieData } = input;

      const movieFields = {
        movieId: movieData.movieId,
        directedBy: movieData.directedBy,
        durationMinutes: movieData.durationMinutes,
        name: movieData.name,
        posterImage: movieData.posterImage,
        synopsis: movieData.synopsis,
        tomatoMeter: movieData.tomatoMeter,
        consensus: movieData.consensus,
        totalGross: movieData.totalGross,
        releaseDate: movieData.releaseDate,
        emsVersionId: movieData.emsVersionId,
        motionPictureRating: movieData.motionPictureRating,
        userRating: movieData.userRating,
        genres: [...movieData.genres],
      }

      try {
        return await prisma.watchListItem.upsert({
          where: {
            userId_movieId: {
              userId,
              movieId: movieData.movieId,
            },
          },
          update: movieFields,
          create: {
            ...movieFields,
            user: {
              connect: {
                id: userId,
              },
            },
          },
        })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      }
    }),
  delete: protectedProcedure.input(z.object({
    movieId: z.string()
  })).mutation(async ({ ctx, input }) => {
    const { prisma, session } = ctx;
    const userId = session.user.id;
    const { movieId } = input;

    return prisma.watchListItem.deleteMany({
      where: {
        movieId: movieId,
        userId: userId
      }
    })
  }),
  query: publicProcedure.input(z.object({
    movieId: z.string()
  })).query(async ({ ctx, input }) => {
    const { prisma, session } = ctx;
    const userId = session?.user?.id;
    const { movieId } = input;

    // Without a session there is no watchlist to look up. Returning early
    // also keeps Prisma from dropping the undefined userId filter and
    // matching other users' items.
    if (!userId) {
      return { movie: [] }
    }

    const movie = await prisma.watchListItem.findMany({
      where: {
        userId: userId,
        movieId: movieId
      }
    })
    return { movie }
  }),

})
