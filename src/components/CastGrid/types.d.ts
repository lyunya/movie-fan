import type { ComponentPropsWithoutRef } from "react";

export interface Credit { 
  id: string
  role?: string
  name: string
  characterName?: string
  headShotImage?: Image
}

export interface CastGridProps extends ComponentPropsWithoutRef<'div'>{
  cast: Credit[]
}