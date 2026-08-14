import { UserRouter } from './routers/user'
import { watchListItemRouter } from './routers/watchListItem'
import { tmdbRouter } from './routers/tmdb'
import { diaryRouter } from './routers/diary'
import { listsRouter } from './routers/lists'
import { roomsRouter } from './routers/rooms'
import { createTRPCRouter } from './trpc'
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  movie: watchListItemRouter,
  user: UserRouter,
  tmdb: tmdbRouter,
  diary: diaryRouter,
  lists: listsRouter,
  rooms: roomsRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
