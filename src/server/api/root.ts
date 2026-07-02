import { UserRouter } from './routers/user';
import { watchListItemRouter } from './routers/watchListItem';
import { flixsterRouter } from './routers/flixster';
import { createTRPCRouter } from "./trpc";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  movie: watchListItemRouter,
  user: UserRouter,
  flixster: flixsterRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
