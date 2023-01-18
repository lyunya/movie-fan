import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from './../trpc';

export const UserRouter = createTRPCRouter({
  query: protectedProcedure.query(async ({ ctx }) => {
    const { prisma, session } = ctx;
    const userIdNum = session?.user?.id;

    const user = await prisma.user.findUnique({
      where: {
        id: userIdNum
      }
    })
    const movies = await prisma.watchListItem.findMany({
      where: {
        userId: userIdNum
      }
    })

    return {user, movies};
  })
})