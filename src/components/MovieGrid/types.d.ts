import type { MovieSchema } from '@/types/MovieSchema';

export interface MovieGridProps extends ComponentPropsWithRef<'div'> {
  movieCards: MovieSchema[];
}