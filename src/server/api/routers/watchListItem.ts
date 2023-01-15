import { MovieSchema } from '@/types/MovieSchema';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from './../trpc';

export const watchListItemRouter = createTRPCRouter({
  create: protectedProcedure.input(z.object({
    movieData: MovieSchema
  }))
    .mutation(({ ctx, input }) => { 
      const { prisma, session } = ctx;
      const userIdNum = session.user.id;
      const { movieData } = input;

      return prisma.watchListItem.create({
        data: {
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
          motionPictureRating: movieData.motionPictureRating,
          genres: [...movieData.genres],
          user: {
            connect: {
              id: userIdNum
            }
          }
        }
      })
    })
})