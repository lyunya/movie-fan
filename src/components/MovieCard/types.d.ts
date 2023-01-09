import { Image } from '@/types/main';
import type { ComponentPropsWithRef } from 'react';

export interface MovieCardProps extends ComponentPropsWithRef<'div'> {
  name: string;
  posterImage: Image;
  emsVersionId: string;
}