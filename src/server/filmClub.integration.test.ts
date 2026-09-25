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
vi.mock('@/server/tmdb', () => ({
  fetchMovieDetails: async (id: string) => ({
    id,
    emsVersionId: id,
    name: `Film ${id}`,
    genres: [],
    posterImage: { url: '' },
    releaseDate: '2020-01-01',
    durationMinutes: 100,
  }),
  fetchTonightChoices: async () => [],
  fetchSearch: async () => ({ movies: [] }),
  fetchWatchProviders: async () => [],
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
const film = (id: string) => ({
  movieId: id,
  emsVersionId: id,
  name: `Film ${id}`,
  directedBy: '',
  durationMinutes: 100,
  posterImage: '',
  synopsis: null,
  tomatoMeter: 70,
  consensus: null,
  totalGross: null,
  releaseDate: '2020-01-01',
  motionPictureRating: null,
  genres: ['Drama'],
  userRating: null,
})
describe.skipIf(!enabled)('film club persistence and access boundaries', () => {
  it('imports new films once, keeps dated viewings private, and preserves existing opinions', async () => {
    const input = { movieId: '987654321', rating: 4, watchedDate: '2020-02-29' }
    await expect(caller().movie.importMovie(input)).rejects.toThrow()
    const results = await Promise.all([
      caller(owner).movie.importMovie(input),
      caller(owner).movie.importMovie(input),
    ])
    expect(results.filter((r) => r.added)).toHaveLength(1)
    expect(
      await db.watchEvent.count({
        where: { userId: owner, movieId: input.movieId },
      })
    ).toBe(1)
    const event = await db.watchEvent.findFirstOrThrow({
      where: { userId: owner, movieId: input.movieId },
    })
    expect(event.isPublic).toBe(false)
    await caller(owner).movie.importMovie({ ...input, rating: 1 })
    const saved = await db.watchListItem.findUniqueOrThrow({
      where: { userId_movieId: { userId: owner, movieId: input.movieId } },
    })
    expect(saved.userRating).toBe(4)
    expect(saved.inWatchlist).toBe(false)
    await expect(
      caller(owner).movie.importMovie({ ...input, watchedDate: '2023-02-29' })
    ).rejects.toThrow()
  })
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
    await db.watchListItem.deleteMany({
      where: { userId: { in: [owner, other] } },
    })
    await db.user.deleteMany({ where: { id: { in: [owner, other] } } })
    await db.$disconnect()
  })
  it('unsaving preserves a rating and watched state', async () => {
    await caller(owner).movie.create({
      movieData: { ...film('1'), userRating: 5 },
    })
    await caller(owner).movie.quickAdd({ movieId: '1' })
    await caller(owner).movie.delete({ movieId: '1' })
    expect(
      (await caller(owner).movie.query({ movieId: '1' })).movie[0]
    ).toMatchObject({ userRating: 5, watched: true, inWatchlist: false })
    await caller(owner).movie.setState({ movieId: '1', userRating: null })
    expect(
      (await caller(owner).movie.query({ movieId: '1' })).movie[0]
    ).toMatchObject({ userRating: null, watched: true })
  })
  it('unrated watches count as watched, keep historical ratings separate, and preserve other viewings', async () => {
    const first = await caller(owner).diary.log({
      movieData: film('2'),
      entry: {
        watchedAt: new Date('2025-01-01T12:00:00Z'),
        rating: null,
        review: null,
        tags: [],
      },
    })
    expect(
      (await caller(owner).movie.query({ movieId: '2' })).movie[0]
    ).toMatchObject({ watched: true, inWatchlist: false, userRating: null })
    const second = await caller(owner).diary.log({
      movieData: film('2'),
      entry: {
        watchedAt: new Date('2026-02-02T12:00:00Z'),
        rating: 4,
        review: 'Second watch',
        tags: [],
      },
      updateRating: false,
      keepOnWatchlist: true,
    })
    expect(
      (await caller(owner).movie.query({ movieId: '2' })).movie[0]
    ).toMatchObject({ userRating: null, inWatchlist: true })
    await caller(owner).diary.update({
      id: second.id,
      entry: {
        watchedAt: second.watchedAt,
        rating: 5,
        review: 'Changed my mind',
        tags: [],
      },
    })
    expect(
      (await caller(owner).movie.query({ movieId: '2' })).movie[0]?.userRating
    ).toBeNull()
    await expect(
      caller(other).diary.update({
        id: first.id,
        entry: {
          watchedAt: first.watchedAt,
          rating: 1,
          review: null,
          tags: [],
        },
      })
    ).rejects.toThrow()
    await caller(owner).diary.delete({ id: second.id })
    expect(await caller(owner).diary.history({ movieId: '2' })).toHaveLength(1)
    await expect(
      caller(owner).movie.setState({ movieId: '2', watched: false })
    ).rejects.toThrow()
  })
  it('requires auth and isolates collection updates', async () => {
    await expect(
      caller().movie.setState({ movieId: '1', watched: true })
    ).rejects.toThrow()
    await caller(other).movie.delete({ movieId: '1' })
    expect(
      (await caller(owner).movie.query({ movieId: '1' })).movie
    ).toHaveLength(1)
  })
  it('reorders lists, rejects stale edits and foreign ownership, and preserves notes', async () => {
    const list = await caller(owner).lists.create({
      name: 'Integration Top 3',
      ranked: true,
    })
    for (const movieId of ['11', '12', '13'])
      await caller(owner).lists.addMovie({
        listId: list.id,
        movie: {
          movieId,
          name: movieId,
          posterImage: null,
          releaseDate: null,
          tomatoMeter: null,
        },
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
      movie: {
        movieId: '45',
        name: 'First film',
        posterImage: null,
        releaseDate: null,
        tomatoMeter: null,
      },
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
    await caller(owner).diary.log({
      movieData: film('31'),
      entry: {
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
