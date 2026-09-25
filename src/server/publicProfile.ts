import { prisma } from './db'
import { auth } from './auth'
export const getPublicProfile = async (id: string) => {
  const session = await auth()
  const user = await prisma.user.findFirst({
    where: { OR: [{ id }, { handle: id.toLowerCase() }] },
    select: {
      id: true,
      name: true,
      image: true,
      handle: true,
      bio: true,
      publicWatchlist: true,
    },
  })
  if (!user || !user.publicWatchlist) return null
  if (
    session?.user?.id &&
    (await prisma.userConnection.findFirst({
      where: {
        kind: 'BLOCK',
        OR: [
          { userId: user.id, targetId: session.user.id },
          { userId: session.user.id, targetId: user.id },
        ],
      },
    }))
  )
    return null
  const [movies, entries, lists] = await Promise.all([
    prisma.watchListItem.findMany({
      where: {
        userId: user.id,
        OR: [{ inWatchlist: true }, { watched: true }, { favorite: true }],
      },
      orderBy: [{ favorite: 'desc' }, { name: 'asc' }],
    }),
    prisma.watchEvent.findMany({
      where: { userId: user.id, isPublic: true },
      orderBy: { watchedAt: 'desc' },
      take: 20,
    }),
    prisma.movieList.findMany({
      where: { userId: user.id, isPublic: true },
      orderBy: { updatedAt: 'desc' },
      take: 12,
      include: { _count: { select: { items: true } } },
    }),
  ])
  return { user, movies, entries, lists }
}
