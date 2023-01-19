import type { Image } from "@/types/main"

export interface CastCardProps extends ComponentPropsWithoutRef<'div'> {
  id: string
  role?: string
  name: string
  characterName?: string
  headShotImage?: Image
}