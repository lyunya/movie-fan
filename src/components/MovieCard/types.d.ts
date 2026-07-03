import type { Image } from '@/types/main';
import type { ComponentPropsWithRef } from 'react';

export interface MovieCardProps extends ComponentPropsWithRef<'div'> {
  name: string;
  posterImage: Image | string | null;
  emsVersionId: string;
  releaseDate?: string | null;
  // 0-100 TMDB score, from either a live API result or the cached DB watchlist row
  tomatoMeter?: number | null;
  // The signed-in user's own star rating (DB watchlist items only)
  userRating?: number | null;
  // When set, renders a Netflix-style giant numeral beside the poster
  rank?: number;
}
