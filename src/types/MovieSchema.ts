import type { z } from 'zod';
import { object, string, number, array } from 'zod';

export const MovieSchema = object({
  movieId: string(),
  directedBy: string(),
  durationMinutes: number(),
  name: string(),
  posterImage: string(),
  synopsis: string().nullable(),
  tomatoMeter: number().nullable(),
  consensus: string().nullable(),
  totalGross: string().nullable(),
  releaseDate: string(),
  motionPictureRating: string().nullable(),
  genres: array(string()),
});

export type MovieType = z.infer<typeof MovieSchema>;