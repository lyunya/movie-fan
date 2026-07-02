import type { Image } from '@/types/main';
import type { ComponentPropsWithRef } from 'react';

export interface MovieCardProps extends ComponentPropsWithRef<'div'> {
  name: string;
  posterImage: Image | string | null;
  emsVersionId: string;
  releaseDate?: string | null;
  // Critic score: an object from the API, a number from the DB watchlist
  tomatoRating?: { tomatometer?: number | null } | null;
  tomatoMeter?: number | null;
  // The signed-in user's own star rating (DB watchlist items only)
  userRating?: number | null;
  // When set, renders a Netflix-style giant numeral beside the poster
  rank?: number;
}
