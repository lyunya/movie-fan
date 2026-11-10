import { cache } from 'react'
import { prisma } from './db'
import { auth } from './auth'
import { tasteMatch } from '@/utils/tasteMatch'
// cache(): the page and its metadata share one lookup per request
export const getPublicProfile = cache(async (id: string) => {
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
  // For a signed-in visitor looking at someone else: what the two have in
  // common. Only the visitor's own entries for films already on this profile.
  const viewerId = session?.user?.id
  const mine =
    viewerId && viewerId !== user.id && movies.length
      ? await prisma.watchListItem.findMany({
          where: {
            userId: viewerId,
            movieId: { in: movies.map((m) => m.movieId) },
          },
          select: { movieId: true, inWatchlist: true, userRating: true },
        })
      : []
  const iWant = new Set(mine.filter((m) => m.inWatchlist).map((m) => m.movieId))
  return {
    user,
    movies,
    entries,
    lists,
    isOwner: viewerId === user.id,
    bothWant: movies.filter((m) => m.inWatchlist && iWant.has(m.movieId)),
    match: tasteMatch(
      mine.map((m) => ({ filmId: m.movieId, rating: m.userRating })),
      movies.map((m) => ({ filmId: m.movieId, rating: m.userRating }))
    ),
  }
})
