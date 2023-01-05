import type { ComponentPropsWithRef } from 'react';

export interface MovieCardProps extends ComponentPropsWithRef<'div'> {
  title: string;
  poster_path: string;
  overview: string;
  children?: never;
}