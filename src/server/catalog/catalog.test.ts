import { describe, expect, it } from 'vitest'
import { createCatalog, discoverParams } from './createCatalog'
import { FIXTURE_FIRST_ID, fixtureSource } from './fixtures'
import { CatalogUnavailable, type CatalogSource } from './source'

const setup = () => {
  const source = fixtureSource()
  return { source, catalog: createCatalog(source) }
}

describe('Catalog films and lists', () => {
  it('returns Films with ids, paths, and raw scores', async () => {
    const { catalog } = setup()
    const [first] = await catalog.films('popular')
    expect(first).toMatchObject({
      id: String(FIXTURE_FIRST_ID),
      title: 'The Lighthouse Keeper',
      posterPath: `/p${FIXTURE_FIRST_ID}.jpg`,
      backdropPath: `/b${FIXTURE_FIRST_ID}.jpg`,
    })
    expect(first!.tmdb.average).toBeGreaterThan(0)
    expect(first!.tmdb.votes).toBeGreaterThan(0)
  })

  it('treats a 0 average with no votes as no score', async () => {
    const { catalog } = setup()
    const films = await catalog.films('popular')
    const unreleased = films.find((f) => f.id === String(FIXTURE_FIRST_ID + 6))!
    expect(unreleased.tmdb).toEqual({ average: null, votes: 0 })
  })

  it('asks for regional lists with a region and global ones without', async () => {
    const { catalog, source } = setup()
    await catalog.films('nowPlaying', { region: 'GB' })
    await catalog.films('popular')
    expect(source.calls[0]!.params.region).toBe('GB')
    expect(source.calls[1]!.params.region).toBeUndefined()
  })
})

describe('Catalog film detail', () => {
  it('assembles everything the movie page needs', async () => {
    const { catalog } = setup()
    const film = await catalog.filmDetail(String(FIXTURE_FIRST_ID + 1))
    expect(film).toMatchObject({
      id: String(FIXTURE_FIRST_ID + 1),
      certification: 'PG-13',
      trailerKey: `trailer${FIXTURE_FIRST_ID + 1}`,
      directors: [{ personId: 900, name: 'Mara Voss' }],
      tagline: 'Some lights are meant to be followed.',
    })
    expect(film!.genres.map((g) => g.id)).toEqual(film!.genreIds)
    expect(film!.stills).toHaveLength(6)
    expect(film!.similar.length).toBeGreaterThan(0)
    expect(film!.crew[0]!.job).toBe('Director')
    expect(film!.imdb).toEqual({
      rating: expect.any(Number),
      votes: expect.any(Number),
    })
  })

  it('returns null for unknown or malformed ids instead of throwing', async () => {
    const { catalog } = setup()
    await expect(catalog.filmDetail('999999')).resolves.toBeNull()
    await expect(catalog.filmDetail('abc')).resolves.toBeNull()
  })

  it('lets an outage surface as an error, not a missing film', async () => {
    const down: CatalogSource = {
      tmdb: () => Promise.reject(new CatalogUnavailable(503, '/movie/1')),
      imdb: async () => null,
    }
    await expect(createCatalog(down).filmDetail('1')).rejects.toThrow(
      CatalogUnavailable
    )
  })

  it('reports where to watch in the requested region only', async () => {
    const { catalog } = setup()
    const id = String(FIXTURE_FIRST_ID) // index 0: subscription + free + rent
    const us = await catalog.whereToWatch(id, 'US')
    expect(us?.subscription.map((p) => p.name)).toEqual(['Netflix'])
    expect(us?.free.map((p) => p.name)).toEqual(['Tubi TV'])
    expect(us?.rent.map((p) => p.name)).toEqual(['Apple TV'])
    await expect(catalog.whereToWatch(id, 'GB')).resolves.toBeNull()
  })
})

describe('Catalog discover', () => {
  it('builds one set of TMDB filters', () => {
    expect(
      discoverParams({
        genreIds: [35, 27],
        maxRuntime: 100,
        decade: 1990,
        minScore: 65,
        minVotes: 100,
        region: 'CA',
        streamingOn: [8, 337],
        page: 2,
      })
    ).toMatchObject({
      with_genres: '35|27',
      'with_runtime.lte': '100',
      'primary_release_date.gte': '1990-01-01',
      'primary_release_date.lte': '1999-12-31',
      'vote_average.gte': '6.5',
      'vote_count.gte': '100',
      region: 'CA',
      watch_region: 'CA',
      with_watch_monetization_types: 'flatrate',
      with_watch_providers: '8|337',
      page: '2',
    })
  })

  it('streams on any service when no services are chosen', () => {
    const params = discoverParams({ streamingOn: [] })
    expect(params.watch_region).toBe('US')
    expect(params.with_watch_providers).toBeUndefined()
    expect(discoverParams({}).watch_region).toBeUndefined()
  })

  it('keeps the earlier of a decade end and a release cutoff', () => {
    expect(
      discoverParams({ decade: 2020, releasedBy: '2026-09-24' })[
        'primary_release_date.lte'
      ]
    ).toBe('2026-09-24')
    expect(
      discoverParams({ decade: 1990, releasedBy: '2026-09-24' })[
        'primary_release_date.lte'
      ]
    ).toBe('1999-12-31')
  })

  it('returns a page of genre matches', async () => {
    const { catalog } = setup()
    const page = await catalog.discover({ genreIds: [35] })
    expect(page.films.length).toBeGreaterThan(0)
    expect(page.films.every((f) => f.genreIds.includes(35))).toBe(true)
  })
})

describe('Catalog search, people, and services', () => {
  it('separates films from people', async () => {
    const { catalog } = setup()
    const results = await catalog.search('ada')
    expect(results.people[0]).toMatchObject({ id: 500, name: 'Ada Marlowe' })
    expect(results.films.every((f) => f.posterPath)).toBe(true)
  })

  it('loads a person with directing and acting credits', async () => {
    const { catalog } = setup()
    const person = await catalog.person(500)
    expect(person?.credits.some((c) => c.role === 'Directing')).toBe(true)
    expect(person?.credits[0]!.filmId).toMatch(/^\d+$/)
    await expect(catalog.person(599)).resolves.toBeNull()
    await expect(catalog.personByName('theo')).resolves.toMatchObject({
      name: 'Theo Vance',
    })
  })

  it('lists featured services first', async () => {
    const { catalog } = setup()
    const names = (await catalog.providers('US')).map((p) => p.name)
    expect(names.slice(0, 2)).toEqual(['Netflix', 'Disney Plus'])
  })

  it('adds IMDb ratings where known and leaves the rest alone', async () => {
    const { catalog } = setup()
    const films = await catalog.withImdb(await catalog.films('popular'))
    expect(films.some((f) => f.imdb)).toBe(true)
    expect(films.some((f) => !f.imdb)).toBe(true)
  })
})
