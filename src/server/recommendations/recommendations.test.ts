import { describe, expect, it } from 'vitest'
import { createCatalog } from '@/server/catalog/createCatalog'
import { FIXTURE_FIRST_ID, fixtureSource } from '@/server/catalog/fixtures'
import { createRecommendations, type MemberFilm } from './createRecommendations'
import { tasteGenres } from './taste'

const setup = () => {
  const source = fixtureSource()
  return {
    source,
    recs: createRecommendations({ films: createCatalog(source) }),
  }
}
const entry = (over: Partial<MemberFilm>): MemberFilm => ({
  filmId: String(FIXTURE_FIRST_ID + 50),
  genres: [],
  rating: null,
  favorite: false,
  watched: false,
  inWatchlist: false,
  dismissed: false,
  ...over,
})
const HORROR = 27
const filters = {
  genreIds: [HORROR],
  minScore: 60,
  region: 'US',
  surprise: 0,
}

describe('Taste', () => {
  it('weighs loved films over saved ones, and counts low ratings against', () => {
    expect(
      tasteGenres([
        entry({ genres: ['Drama'], inWatchlist: true }),
        entry({ genres: ['Drama'], inWatchlist: true }),
        entry({ genres: ['Horror'], rating: 5, watched: true }),
        entry({ genres: ['Comedy'], rating: 1, watched: true }),
        entry({ genres: ['Comedy'], inWatchlist: true }),
        entry({ genres: ['Western'], dismissed: true, rating: 5 }),
      ])
    ).toEqual(['Horror', 'Drama'])
  })
})

describe('For you', () => {
  it("finds popular films in the Member's strongest genres they don't have yet", async () => {
    const { recs } = setup()
    const owned = String(FIXTURE_FIRST_ID + 7) // a Horror film
    const result = await recs.forYou({
      library: [
        entry({ filmId: owned, genres: ['Horror'], watched: true }),
        entry({ genres: ['Mystery'], inWatchlist: true }),
      ],
    })
    expect(result.topGenre).toBe('Horror')
    expect(result.becauseOf).toEqual([])
    expect(result.films.length).toBeGreaterThan(0)
    expect(result.films.some((f) => f.id === owned)).toBe(false)
    expect(
      result.films.every((f) =>
        f.genreIds.some((g) => [HORROR, 9648].includes(g))
      )
    ).toBe(true)
  })

  it('leads with films similar to the ones they loved, and says which', async () => {
    const { recs, source } = setup()
    const loved = String(FIXTURE_FIRST_ID + 2)
    const alsoLoved = String(FIXTURE_FIRST_ID + 20)
    const catalog = createCatalog(fixtureSource())
    const [first, second] = await Promise.all([
      catalog.similarTo(loved),
      catalog.similarTo(alsoLoved),
    ])
    const owned = first[1]!.id
    const result = await recs.forYou({
      library: [
        entry({ filmId: loved, title: 'Loved One', rating: 5, watched: true }),
        entry({ filmId: alsoLoved, title: 'Loved Two', favorite: true }),
        entry({ filmId: owned, inWatchlist: true }),
        entry({
          filmId: String(FIXTURE_FIRST_ID + 30),
          title: 'Dismissed',
          favorite: true,
          dismissed: true,
        }),
      ],
      limit: 4,
    })
    // Alternates between the two loved films, skipping what they already have
    expect(result.films.map((f) => f.id).slice(0, 2)).toEqual([
      first[0]!.id,
      second[0]!.id,
    ])
    expect(result.films).toHaveLength(4)
    expect(new Set(result.films.map((f) => f.id)).size).toBe(4)
    expect(
      result.films.some((f) => [loved, alsoLoved, owned].includes(f.id))
    ).toBe(false)
    expect(result.becauseOf).toEqual(['Loved One', 'Loved Two'])
    expect(
      source.calls.filter((c) => c.path.endsWith('/recommendations'))
    ).toHaveLength(2)
  })

  it('has nothing to say without a taste', async () => {
    const { recs } = setup()
    const nothing = { films: [], topGenre: null, becauseOf: [] }
    expect(await recs.forYou({ library: [] })).toEqual(nothing)
    expect(
      await recs.forYou({
        library: [entry({ genres: ['Comedy'], rating: 1, watched: true })],
      })
    ).toEqual(nothing)
  })
})

describe('Tonight', () => {
  it('asks the Catalog for released, well-voted films on the right page', async () => {
    const { recs, source } = setup()
    await recs.pickTonight({
      library: [],
      filters: { ...filters, surprise: 2, streamingOn: [8] },
      today: '2026-09-24',
    })
    const call = source.calls.find((c) => c.path === '/discover/movie')!
    expect(call.params).toMatchObject({
      with_genres: String(HORROR),
      'vote_count.gte': '100',
      'vote_average.gte': '6',
      'primary_release_date.lte': '2026-09-24',
      with_watch_providers: '8',
      page: '3',
    })
  })

  it('leaves out what the Member watched, dismissed, or was just shown', async () => {
    const { recs } = setup()
    const guest = await recs.pickTonight({ library: [], filters })
    const [first, second, third] = guest.map((p) => p.film.id)
    expect(guest.map((p) => p.role)[0]).toBe('Highly rated')

    const picks = await recs.pickTonight({
      library: [
        entry({ filmId: first!, watched: true, rating: 4, genres: ['Horror'] }),
        entry({ filmId: second!, dismissed: true }),
      ],
      excludeIds: [third!],
      filters,
    })
    const ids = picks.map((p) => p.film.id)
    expect(ids).not.toContain(first)
    expect(ids).not.toContain(second)
    expect(ids).not.toContain(third)
    expect(ids).toHaveLength(3)
  })

  it('offers a rewatch saved to the Watchlist first, with its reason', async () => {
    const { recs } = setup()
    const [pick] = await recs.pickTonight({ library: [], filters })
    const [again] = await recs.pickTonight({
      library: [
        entry({
          filmId: pick!.film.id,
          watched: true,
          inWatchlist: true,
          rating: 5,
          genres: ['Horror'],
        }),
      ],
      filters: { ...filters, maxRuntime: 120 },
    })
    expect(again).toMatchObject({
      film: { id: pick!.film.id },
      role: 'From your watchlist',
    })
    expect(again!.reason).toBe(
      'You saved this one for a night like tonight. Up to 120 minutes · Matches your filters · TMDB 60% or higher'
    )
  })
})
