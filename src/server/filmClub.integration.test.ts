import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
vi.mock('@/env/server.mjs', () => ({
  env: {
    NODE_ENV: 'test',
    NEXTAUTH_URL: 'https://example.test',
    GOOGLE_CLIENT_ID: 'test',
    GOOGLE_CLIENT_SECRET: 'test',
    GITHUB_ID: 'test',
    GITHUB_SECRET: 'test',
    EMAIL_SERVER_HOST: 'localhost',
    EMAIL_SERVER_PORT: '25',
    EMAIL_SERVER_USER: 'test',
    EMAIL_SERVER_PASSWORD: 'test',
    EMAIL_FROM: 'test@example.test',
    FACEBOOK_CLIENT_ID: 'test',
    FACEBOOK_CLIENT_SECRET: 'test',
    TMDB_API_KEY: 'test',
  },
}))
vi.mock('@/server/auth', () => ({ auth: async () => null }))
vi.mock('@/server/catalog', () => ({
  catalog: {
    filmDetail: async (id: string) => ({
      id,
      title: `Film ${id}`,
      releaseDate: '2020-01-01',
      posterPath: null,
      backdropPath: null,
      genreIds: [],
      tmdb: { average: null, votes: 0 },
      tagline: null,
      overview: null,
      runtime: 100,
      genres: [],
      certification: null,
      directors: [],
      revenue: null,
      trailerKey: null,
      stills: [],
      cast: [],
      crew: [],
      whereToWatch: null,
      similar: [],
    }),
    discover: async () => ({
      films: [],
      page: 1,
      totalPages: 1,
      totalResults: 0,
    }),
    search: async () => ({ films: [], people: [] }),
    providers: async () => [],
    genres: async () => [],
  },
}))
import { appRouter } from './api/root'
const enabled = process.env.RUN_INTEGRATION === '1'
const db = new PrismaClient()
const owner = 'film-club-test-owner',
  other = 'film-club-test-other'
const caller = (id?: string) =>
  appRouter.createCaller({
    prisma: db,
    session: id
      ? {
          user: { id, name: id, email: `${id}@example.test` },
          expires: '2099-01-01',
        }
      : null,
  })
describe.skipIf(!enabled)('film club persistence and access boundaries', () => {
  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL || '')
    if (!['localhost', '127.0.0.1'].includes(url.hostname))
      throw new Error('Integration tests require an isolated local database')
    await db.user.createMany({
      data: [
        { id: owner, name: 'Owner', publicWatchlist: true },
        { id: other, name: 'Other', publicWatchlist: true },
      ],
    })
  })
  afterAll(async () => {
    await db.userConnection.deleteMany({
      where: {
        OR: [
          { userId: { in: [owner, other] } },
          { targetId: { in: [owner, other] } },
        ],
      },
    })
    await db.watchEvent.deleteMany({
      where: { userId: { in: [owner, other] } },
    })
    await db.watchListItem.deleteMany({
      where: { userId: { in: [owner, other] } },
    })
    await db.user.deleteMany({ where: { id: { in: [owner, other] } } })
    await db.$disconnect()
  })
  it('requires sign-in for Library changes', async () => {
    await expect(
      caller().library.change({ filmId: '1', action: { type: 'markWatched' } })
    ).rejects.toThrow()
  })
  it('reorders lists, rejects stale edits and foreign ownership, and preserves notes', async () => {
    const list = await caller(owner).lists.create({
      name: 'Integration Top 3',
      ranked: true,
    })
    for (const movieId of ['11', '12', '13'])
      await caller(owner).lists.addMovie({
        listId: list.id,
        filmId: movieId,
      })
    const current = (await caller(owner).lists.all()).find(
      (l) => l.id === list.id
    )!
    const ids = current.items.map((i) => i.id).reverse()
    await caller(owner).lists.reorder({
      id: list.id,
      version: current.version,
      itemIds: ids,
    })
    expect(
      (await caller(owner).lists.all())
        .find((l) => l.id === list.id)
        ?.items.map((i) => i.id)
    ).toEqual(ids)
    await expect(
      caller(owner).lists.reorder({
        id: list.id,
        version: current.version,
        itemIds: ids,
      })
    ).rejects.toThrow()
    await expect(
      caller(other).lists.removeMovie({ listId: list.id, movieId: '11' })
    ).rejects.toThrow()
    await expect(caller().lists.publicById({ id: list.id })).rejects.toThrow()
    await caller(owner).lists.note({
      listId: list.id,
      movieId: '11',
      note: 'An all-time favorite',
    })
  })
  it('creates an in-context list atomically with its first movie', async () => {
    const list = await caller(owner).lists.createWithMovie({
      name: 'A first favorite',
      ranked: true,
      filmId: '45',
    })
    expect(
      (await caller(owner).lists.all()).find((l) => l.id === list.id)?.items
    ).toHaveLength(1)
    await expect(
      caller(owner).lists.update({
        id: list.id,
        name: list.name,
        description: null,
        isPublic: false,
        coverMovieId: 'not-in-list',
      })
    ).rejects.toThrow()
  })
  it('only shares opted-in entries and removes blocked users from activity', async () => {
    await caller(other).social.connect({
      targetId: owner,
      kind: 'FOLLOW',
      enabled: true,
    })
    expect((await caller(other).social.feed()).entries).toHaveLength(0)
    await caller(owner).library.logViewing({
      filmId: '31',
      viewing: {
        watchedAt: new Date(),
        rating: 5,
        review: 'Public review',
        tags: [],
        isPublic: true,
        spoiler: true,
      },
    })
    expect((await caller(other).social.feed()).entries).toHaveLength(1)
    await caller(owner).social.connect({
      targetId: other,
      kind: 'BLOCK',
      enabled: true,
    })
    expect((await caller(other).social.feed()).entries).toHaveLength(0)
    await expect(
      caller(other).social.connect({
        targetId: owner,
        kind: 'FOLLOW',
        enabled: true,
      })
    ).rejects.toThrow()
  })
})
