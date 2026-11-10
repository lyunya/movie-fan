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
  it('adds many films to a list in one call, skipping ones already there', async () => {
    const list = await caller(owner).lists.create({ name: 'Bulk adds' })
    await caller(owner).lists.addMovie({ listId: list.id, filmId: '21' })
    expect(
      await caller(owner).lists.addMovies({
        listId: list.id,
        filmIds: ['21', '22', '23', '22'],
      })
    ).toEqual({ added: 2, failed: 0 })
    const saved = (await caller(owner).lists.all()).find(
      (l) => l.id === list.id
    )!
    expect(saved.items.map((i) => [i.movieId, i.position])).toEqual([
      ['21', 0],
      ['22', 1],
      ['23', 2],
    ])
    await expect(
      caller(other).lists.addMovies({ listId: list.id, filmIds: ['24'] })
    ).rejects.toThrow()
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
    // The same shared viewing shows on the film's own page, for followers only
    await caller(owner).library.logViewing({
      filmId: '31',
      viewing: {
        watchedAt: new Date('2020-01-01'),
        rating: 2,
        review: 'Private first impression',
        tags: [],
        isPublic: false,
        spoiler: false,
      },
    })
    const onFilm = await caller(other).social.filmActivity({ filmId: '31' })
    expect(onFilm).toHaveLength(1)
    expect(onFilm[0]).toMatchObject({
      rating: 5,
      review: 'Public review',
      member: { id: owner, name: 'Owner' },
    })
    expect(await caller(other).social.filmActivity({ filmId: '32' })).toEqual(
      []
    )
    expect(await caller(owner).social.filmActivity({ filmId: '31' })).toEqual(
      []
    )
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
    expect(await caller(other).social.filmActivity({ filmId: '31' })).toEqual(
      []
    )
  })
  it('deletes an account with everything in it, and nothing of anyone else', async () => {
    const leaving = 'film-club-test-leaving'
    await db.user.create({
      data: { id: leaving, name: 'Leaving', email: 'leaving@example.test' },
    })
    await db.session.create({
      data: {
        sessionToken: 'film-club-test-leaving-session',
        userId: leaving,
        expires: new Date('2099-01-01'),
      },
    })
    await caller(leaving).library.change({
      filmId: '41',
      action: { type: 'save' },
    })
    await caller(leaving).library.logViewing({
      filmId: '42',
      viewing: {
        watchedAt: new Date(),
        rating: 4,
        review: null,
        tags: [],
        isPublic: false,
        spoiler: false,
      },
    })
    await caller(leaving).lists.createWithMovie({
      name: 'Going away',
      filmId: '43',
    })
    await db.streamingDelivery.create({
      data: { id: 'film-club-test-leaving-delivery', userId: leaving },
    })
    const ownerEntries = await db.watchListItem.count({
      where: { userId: owner },
    })
    await expect(
      // @ts-expect-error the confirmation word is required
      caller(leaving).member.deleteAccount({ confirm: 'yes' })
    ).rejects.toThrow()
    await caller(leaving).member.deleteAccount({ confirm: 'DELETE' })
    const where = { userId: leaving }
    expect(await db.user.count({ where: { id: leaving } })).toBe(0)
    expect(await db.session.count({ where })).toBe(0)
    expect(await db.watchListItem.count({ where })).toBe(0)
    expect(await db.watchEvent.count({ where })).toBe(0)
    expect(await db.movieList.count({ where })).toBe(0)
    expect(await db.streamingDelivery.count({ where })).toBe(0)
    expect(await db.watchListItem.count({ where: { userId: owner } })).toBe(
      ownerEntries
    )
  })
})
