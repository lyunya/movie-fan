/**
 * The Library against a real Postgres (run with `npm run test:integration`
 * and a local DATABASE_URL), with the offline catalog standing in for TMDB.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { createCatalog } from '@/server/catalog/createCatalog'
import { FIXTURE_FIRST_ID, fixtureSource } from '@/server/catalog/fixtures'
import { createLibrary } from './createLibrary'

const enabled = process.env.RUN_INTEGRATION === '1'
const db = new PrismaClient()
const library = createLibrary({ db, films: createCatalog(fixtureSource()) })

const ada = 'library-test-ada'
const ben = 'library-test-ben'
const film = (n: number) => String(FIXTURE_FIRST_ID + n)
const viewing = (over: Partial<Parameters<typeof lib.logViewing>[1]> = {}) => ({
  watchedAt: new Date('2026-01-02T12:00:00Z'),
  rating: null,
  review: null,
  tags: [],
  isPublic: false,
  spoiler: false,
  ...over,
})
const lib = library.forMember(ada)
const entry = async (filmId: string, member = ada) =>
  (await library.forMember(member).index()).find((e) => e.filmId === filmId) ??
  null

const clean = async () => {
  await db.watchEvent.deleteMany({ where: { userId: { in: [ada, ben] } } })
  await db.watchListItem.deleteMany({ where: { userId: { in: [ada, ben] } } })
}

describe.skipIf(!enabled)('Library', () => {
  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL || '')
    if (!['localhost', '127.0.0.1'].includes(url.hostname))
      throw new Error('Integration tests require an isolated local database')
    await db.user.createMany({
      data: [
        { id: ada, name: 'Ada' },
        { id: ben, name: 'Ben' },
      ],
      skipDuplicates: true,
    })
  })
  beforeEach(clean)
  afterAll(async () => {
    await clean()
    await db.user.deleteMany({ where: { id: { in: [ada, ben] } } })
    await db.$disconnect()
  })

  it('builds the snapshot from the Catalog and stores image paths', async () => {
    await lib.save(film(1))
    const [saved] = await lib.entries()
    expect(saved).toMatchObject({
      filmId: film(1),
      title: 'Midnight at the Paramount',
      posterPath: `/p${film(1)}.jpg`,
      directedBy: 'Mara Voss',
      certification: 'PG-13',
      inWatchlist: true,
      watched: false,
    })
    expect(saved!.savedAt).toBeInstanceOf(Date)
  })

  it('refuses Films the Catalog does not know', async () => {
    await expect(lib.save('999999')).rejects.toMatchObject({
      code: 'FILM_NOT_FOUND',
    })
  })

  it('rating, favoriting and marking watched all take a Film off the Watchlist', async () => {
    for (const [n, act] of [
      [2, () => lib.rate(film(2), 4)],
      [3, () => lib.favorite(film(3))],
      [4, () => lib.markWatched(film(4))],
    ] as const) {
      await lib.save(film(n))
      await act()
      expect(await entry(film(n))).toMatchObject({
        watched: true,
        inWatchlist: false,
      })
    }
  })

  it('saving a Watched Film again keeps its Rating for the rewatch', async () => {
    await lib.rate(film(5), 5)
    await lib.save(film(5))
    expect(await entry(film(5))).toMatchObject({
      watched: true,
      inWatchlist: true,
      rating: 5,
    })
  })

  it('unsaving keeps the Rating and watched state', async () => {
    await lib.rate(film(1), 5)
    await lib.save(film(1))
    await lib.unsave(film(1))
    expect(await entry(film(1))).toMatchObject({
      rating: 5,
      watched: true,
      inWatchlist: false,
    })
  })

  it('undo restores exactly what an action changed', async () => {
    await lib.save(film(1))
    const before = await db.watchListItem.findFirstOrThrow({
      where: { userId: ada, movieId: film(1) },
    })
    const { previous } = await lib.rate(film(1), 3)
    await lib.restore(film(1), previous)
    const after = await db.watchListItem.findFirstOrThrow({
      where: { userId: ada, movieId: film(1) },
    })
    expect(after).toMatchObject({
      inWatchlist: true,
      watched: false,
      userRating: null,
      savedAt: before.savedAt,
    })

    const created = await lib.dismiss(film(2))
    expect(created.previous).toBeNull()
    await lib.restore(film(2), created.previous)
    expect(await entry(film(2))).toBeNull()
  })

  it('applies concurrent changes to one Film one after another', async () => {
    await lib.save(film(12))
    await Promise.all([
      lib.rate(film(12), 5),
      lib.favorite(film(12)),
      lib.dismiss(film(12)),
    ])
    expect(await entry(film(12))).toMatchObject({
      rating: 5,
      favorite: true,
      dismissed: true,
      watched: true,
    })
    const created = await Promise.all([
      lib.rate(film(13), 3),
      lib.favorite(film(13)),
    ])
    expect(created.filter((c) => c.previous === null)).toHaveLength(1)
    expect(await entry(film(13))).toMatchObject({ rating: 3, favorite: true })
  })

  it('undo never un-watches a Film that has Viewings since', async () => {
    const { previous } = await lib.save(film(14))
    await lib.logViewing(film(14), viewing())
    await lib.restore(film(14), previous)
    expect((await entry(film(14)))?.watched).toBe(true)
    await lib.restore(film(14), {
      inWatchlist: false,
      watched: false,
      favorite: true,
      dismissed: false,
      rating: 4,
      savedAt: null,
    })
    expect((await entry(film(14)))?.watched).toBe(true)
  })

  it('logging a Viewing watches the Film and can set its Rating', async () => {
    await lib.save(film(6))
    const first = await lib.logViewing(film(6), viewing({ rating: 4 }))
    expect(first.entry).toMatchObject({
      watched: true,
      inWatchlist: false,
      rating: 4,
    })
    expect(first.viewing).toMatchObject({
      movieId: film(6),
      name: 'Paper Moons',
      posterImage: `/p${film(6)}.jpg`,
    })
    await lib.logViewing(film(6), viewing({ rating: 1 }), {
      useRating: false,
    })
    expect((await entry(film(6)))?.rating).toBe(4)
    const [row] = await lib.entries()
    expect(row!.lastWatchedAt).toEqual(new Date('2026-01-02T12:00:00Z'))
  })

  it('keeps Films with Viewings watched', async () => {
    const { viewing: v } = await lib.logViewing(film(7), viewing())
    await expect(lib.markUnwatched(film(7))).rejects.toMatchObject({
      code: 'HAS_VIEWINGS',
    })
    await lib.deleteViewing(v.id)
    expect((await entry(film(7)))?.watched).toBe(true)
    const unwatched = await lib.markUnwatched(film(7))
    expect(unwatched.entry).toMatchObject({ watched: false, rating: null })
  })

  it('un-watching clears the Rating and Favorite', async () => {
    await lib.favorite(film(8))
    await lib.rate(film(8), 5)
    expect((await lib.markUnwatched(film(8))).entry).toMatchObject({
      watched: false,
      favorite: false,
      rating: null,
      inWatchlist: false,
    })
  })

  it('editing a Viewing leaves the Film Rating alone', async () => {
    const { viewing: v } = await lib.logViewing(film(9), viewing({ rating: 3 }))
    await lib.editViewing(v.id, viewing({ rating: 5, review: 'Better' }))
    expect((await entry(film(9)))?.rating).toBe(3)
  })

  it("keeps one Member's Library and Viewings away from another's", async () => {
    const { viewing: v } = await lib.logViewing(film(1), viewing())
    await expect(
      library.forMember(ben).editViewing(v.id, viewing())
    ).rejects.toMatchObject({ code: 'VIEWING_NOT_FOUND' })
    await expect(
      library.forMember(ben).deleteViewing(v.id)
    ).rejects.toMatchObject({ code: 'VIEWING_NOT_FOUND' })
    await library.forMember(ben).unsave(film(1))
    expect(await entry(film(1))).not.toBeNull()
    expect(await entry(film(1), ben)).toBeNull()
  })

  it('applies bulk actions to Library entries only, in one go', async () => {
    await lib.save(film(1))
    await lib.save(film(2))
    const changes = await lib.apply('markWatched', [film(1), film(2), film(3)])
    expect(changes.map((c) => c.filmId).sort()).toEqual([film(1), film(2)])
    expect(await entry(film(3))).toBeNull()
    expect((await lib.index()).every((e) => e.watched && !e.inWatchlist)).toBe(
      true
    )
  })

  it('lists up-next Films: saved, unwatched, newest first', async () => {
    await lib.save(film(1))
    await lib.save(film(2))
    await lib.rate(film(3), 4)
    await lib.save(film(3))
    expect((await lib.upNext()).map((e) => e.filmId)).toEqual([
      film(2),
      film(1),
    ])
  })

  it('imports a Film once and never overwrites an existing entry', async () => {
    const input = { rating: 4, watchedAt: new Date('2020-02-29') }
    const results = await Promise.all([
      lib.importFilm(film(10), input),
      lib.importFilm(film(10), input),
    ])
    expect(results.filter((r) => r.added)).toHaveLength(1)
    expect(
      await db.watchEvent.count({ where: { userId: ada, movieId: film(10) } })
    ).toBe(1)
    expect(await entry(film(10))).toMatchObject({
      rating: 4,
      watched: true,
      inWatchlist: false,
    })
    await lib.importFilm(film(10), { rating: 1, watchedAt: null })
    expect((await entry(film(10)))?.rating).toBe(4)

    await lib.importFilm(film(11), { rating: null, watchedAt: null })
    expect(await entry(film(11))).toMatchObject({
      inWatchlist: true,
      watched: false,
    })
  })
})
