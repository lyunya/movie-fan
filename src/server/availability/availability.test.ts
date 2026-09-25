import { describe, expect, it } from 'vitest'
import { createCatalog } from '@/server/catalog/createCatalog'
import { FIXTURE_FIRST_ID, fixtureSource } from '@/server/catalog/fixtures'
import type { CatalogSource } from '@/server/catalog/source'
import {
  createAvailability,
  pooled,
  streamingOptions,
} from './createAvailability'
import { guessRegion, REGION_CODES } from './regions'

const id = (n: number) => String(FIXTURE_FIRST_ID + n)
const setup = (source: CatalogSource = fixtureSource()) =>
  createAvailability({ films: createCatalog(source) })
const provider = (pid: number, name: string) => ({
  id: pid,
  name,
  logoPath: null,
})
const where = (over = {}) => ({
  region: 'US',
  link: null,
  subscription: [],
  free: [],
  ads: [],
  rent: [],
  buy: [],
  ...over,
})

describe('Regions', () => {
  it('offers the six Regions', () => {
    expect(REGION_CODES).toEqual(['US', 'CA', 'GB', 'AU', 'IE', 'NZ'])
  })
  it("guesses a guest's Region from their browser languages", () => {
    expect(guessRegion(['en-GB', 'en'])).toBe('GB')
    expect(guessRegion(['fr', 'en-nz'])).toBe('NZ')
    expect(guessRegion(['de-DE', 'en'])).toBe('US')
    expect(guessRegion([])).toBe('US')
  })
})

describe('Streaming options', () => {
  it('counts subscriptions on the chosen services, and anything free', () => {
    const netflix = provider(8, 'Netflix')
    const hulu = provider(15, 'Hulu')
    const tubi = provider(73, 'Tubi TV')
    const pluto = provider(300, 'Pluto TV')
    const all = where({
      subscription: [netflix, hulu],
      free: [tubi],
      ads: [pluto, tubi],
      rent: [provider(2, 'Apple TV')],
    })
    expect(streamingOptions(all, []).map((p) => p.name)).toEqual([
      'Netflix',
      'Hulu',
      'Tubi TV',
      'Pluto TV',
    ])
    expect(streamingOptions(all, [15]).map((p) => p.name)).toEqual([
      'Hulu',
      'Tubi TV',
      'Pluto TV',
    ])
    expect(streamingOptions(where({ rent: [netflix] }), [])).toEqual([])
    expect(streamingOptions(null, [])).toEqual([])
  })
})

describe('streamingFor', () => {
  it('checks films in order and names their services', async () => {
    const result = await setup().streamingFor([id(0), id(1), id(2), id(3)], {
      region: 'US',
      services: [],
    })
    expect(result.available).toEqual([
      { filmId: id(0), services: ['Netflix', 'Tubi TV'] },
      { filmId: id(3), services: ['Netflix'] },
    ])
    expect(result.failed).toEqual([])
  })

  it('respects the chosen services and the Region', async () => {
    const films = [id(0), id(3)]
    expect(
      (await setup().streamingFor(films, { region: 'US', services: [337] }))
        .available
    ).toEqual([{ filmId: id(0), services: ['Tubi TV'] }])
    expect(
      (await setup().streamingFor(films, { region: 'GB', services: [] }))
        .available
    ).toEqual([])
  })

  it('stops once it has found enough', async () => {
    const source = fixtureSource()
    const ids = Array.from({ length: 30 }, (_, n) => id(n))
    const result = await setup(source).streamingFor(
      ids,
      { region: 'US', services: [] },
      { want: 2 }
    )
    expect(result.available.map((a) => a.filmId)).toEqual([id(0), id(3)])
    expect(result.checked).toBe(5)
    expect(source.calls).toHaveLength(5)
  })

  it('reports lookups that failed instead of calling them unavailable', async () => {
    const base = fixtureSource()
    const flaky: CatalogSource = {
      ...base,
      tmdb: (path, params, ttl) =>
        path.includes(id(3))
          ? Promise.reject(new Error('down'))
          : base.tmdb(path, params, ttl),
    }
    const result = await setup(flaky).streamingFor([id(0), id(3)], {
      region: 'US',
      services: [],
    })
    expect(result.failed).toEqual([id(3)])
    expect(result.available.map((a) => a.filmId)).toEqual([id(0)])
  })
})

describe('pooled', () => {
  it('keeps at most `limit` in flight and preserves order', async () => {
    let inFlight = 0,
      peak = 0
    const out = await pooled([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
      peak = Math.max(peak, ++inFlight)
      await new Promise((r) => setTimeout(r, 1))
      inFlight--
      return n * 2
    })
    expect(out).toEqual([2, 4, 6, 8, 10, 12, 14])
    expect(peak).toBe(3)
  })
})
