import { socialRouter } from './routers/social'
import { newsRouter } from './routers/news'
import { UserRouter } from './routers/user'
import { watchListItemRouter } from './routers/watchListItem'
import { catalogRouter } from './routers/catalog'
import { diaryRouter } from './routers/diary'
import { listsRouter } from './routers/lists'
import { createTRPCRouter } from './trpc'
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  movie: watchListItemRouter,
  news: newsRouter,
  social: socialRouter,
  user: UserRouter,
  catalog: catalogRouter,
  diary: diaryRouter,
  lists: listsRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
