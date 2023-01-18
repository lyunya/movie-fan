import type { WatchListItem } from "@prisma/client";

export interface ProfileCardProps extends ComponentPropsWithRef<'div'> {
  user: User
  watchList: WatchListItem[]
  rated: WatchListItem[]
}