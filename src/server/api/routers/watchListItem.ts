import { TRPCError } from '@trpc/server';
import { MovieSchema } from '@/types/MovieSchema';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from './../trpc';
import { fetchMovieDetails } from '@/server/tmdb';
import { createMovieObj } from '@/utils/createMovieObj';
import type { IMovieDetail } from '@/components/MovieDetails/types';

export const watchListItemRouter = createTRPCRouter({
  /**
   * One-click add from a movie card: the client only knows the emsVersionId,
   * so the server fetches full details itself and upserts the row. On update
   * the user's existing star rating is preserved (quick-add never clears it).
   */
  quickAdd: protectedProcedure
    .input(z.object({ movieId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { prisma, session } = ctx;
      const userId = session.user.id;

      const movie = (await fetchMovieDetails(input.movieId).catch(
        () => null
      )) as IMovieDetail | null;
      if (!movie) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Could not load movie details',
        });
      }

      const genres = (movie.genres || []).map((genre) => genre.name);
      const movieData = createMovieObj(movie, input.movieId, genres);
      // Don't touch userRating on update — quick-add is not a rating action,
      // so an existing star rating must survive
      const updateFields: Partial<typeof movieData> = { ...movieData };
      delete updateFields.userRating;

      try {
        return await prisma.watchListItem.upsert({
          where: {
            userId_movieId: { userId, movieId: input.movieId },
          },
          update: updateFields,
          create: {
            ...movieData,
            user: { connect: { id: userId } },
          },
        });
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save movie to watchlist',
        });
      }
    }),
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
      } catch {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to save movie to watchlist' })
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
  query: protectedProcedure.input(z.object({
    movieId: z.string()
  })).query(async ({ ctx, input }) => {
    const { prisma, session } = ctx;
    const userId = session.user.id;
    const { movieId } = input;

    const movie = await prisma.watchListItem.findMany({
      where: {
        userId: userId,
        movieId: movieId
      }
    })
    return { movie }
  }),

})
