import type { ComponentPropsWithoutRef } from "react";
import type { Image } from "@/types/main";

export interface Credit {
  id: string
  role?: string
  name: string
  characterName?: string
  headShotImage?: Image
}

export interface CastGridProps extends ComponentPropsWithoutRef<'div'>{
  cast: Credit[]
  title?: string
}
