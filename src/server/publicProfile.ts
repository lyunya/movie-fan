import { prisma } from './db'

/**
 * Read-only public view of a user's watchlist, or null when the user doesn't
 * exist or hasn't opted in. Used by the /u/[id] page; exposes only the
 * display name, avatar, and saved movies — never email or account data.
 */
export const getPublicProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, image: true, publicWatchlist: true },
  })
  if (!user || !user.publicWatchlist) return null

  const movies = await prisma.watchListItem.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  })
  return { user: { name: user.name, image: user.image }, movies }
}
