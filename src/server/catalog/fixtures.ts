/**
 * Offline CatalogSource: deterministic, TMDB-shaped responses for a small
 * invented film world. Used by tests, and by local development when
 * TMDB_FIXTURES=1 (no API key or network needed).
 *
 * Every request is recorded in `calls` so tests can assert what the Catalog
 * asked for. Image paths are invented, so posters fall back to the
 * placeholder when the app loads them from TMDB's image CDN.
 */
import type { CatalogSource } from './source'
import { CatalogNotFound } from './source'
import type { ImdbScore } from './types'

const TITLES = [
  'The Lighthouse Keeper',
  'Midnight at the Paramount',
  'Velvet Static',
  'A Quiet Heist',
  'Orbit of Strangers',
  'The Last Matinee',
  'Paper Moons',
  'Harbor Lights',
  'Signal Fire',
  'The Glass Orchard',
  'Neon Tide',
  'Salt & Silver',
  'The Cartographer',
  'Wild Hours',
  'Low Tide Motel',
  'Echo Park Blues',
  'The Ninth Reel',
  'Northbound',
  'Small Wonders',
  'Brass Knuckle Waltz',
  'The Understudy',
  'Kingdom of Rain',
  'Afterglow',
  'Lantern Season',
  'The Projectionist',
  'Cold Open',
  'The Long Take',
  'Second Feature',
  'Deep Focus',
  'Jump Cut',
  'Iris Out',
  'Dolly Zoom',
  'Fade to Black',
  'Golden Hour',
  'Day for Night',
  'The Final Cut',
  'Rear Window Seat',
  'Double Exposure',
  'Slow Burn',
  'The Cutting Room',
]
export const FIXTURE_GENRES: [number, string][] = [
  [28, 'Action'],
  [12, 'Adventure'],
  [16, 'Animation'],
  [35, 'Comedy'],
  [80, 'Crime'],
  [18, 'Drama'],
  [14, 'Fantasy'],
  [27, 'Horror'],
  [9648, 'Mystery'],
  [10749, 'Romance'],
  [878, 'Science Fiction'],
  [53, 'Thriller'],
]
const PEOPLE = [
  'Ada Marlowe',
  'Theo Vance',
  'Rosa Quill',
  'Idris Hale',
  'June Okafor',
  'Milo Brandt',
  'Esme Laurent',
  'Cal Reyes',
  'Nia Frost',
  'Oskar Lind',
]
const PROVIDERS = [
  {
    provider_id: 8,
    provider_name: 'Netflix',
    logo_path: '/netflix.jpg',
    display_priority: 1,
  },
  {
    provider_id: 337,
    provider_name: 'Disney Plus',
    logo_path: '/disney.jpg',
    display_priority: 2,
  },
  {
    provider_id: 73,
    provider_name: 'Tubi TV',
    logo_path: '/tubi.jpg',
    display_priority: 9,
  },
  {
    provider_id: 2,
    provider_name: 'Apple TV',
    logo_path: '/apple.jpg',
    display_priority: 5,
  },
]

/** Film ids are 1000 + index; index 6, 13, 20… are unreleased with no votes. */
export const FIXTURE_FIRST_ID = 1000
export const FIXTURE_FILM_COUNT = 60

function film(i: number) {
  const unreleased = i % 7 === 6
  const genre = FIXTURE_GENRES[i % FIXTURE_GENRES.length]![0]
  const second = FIXTURE_GENRES[(i + 3) % FIXTURE_GENRES.length]![0]
  return {
    id: FIXTURE_FIRST_ID + i,
    title: TITLES[i % TITLES.length]!,
    poster_path: `/p${FIXTURE_FIRST_ID + i}.jpg`,
    backdrop_path: `/b${FIXTURE_FIRST_ID + i}.jpg`,
    release_date: unreleased
      ? '2099-12-18'
      : `${2025 - (i % 60)}-0${1 + (i % 9)}-1${i % 9}`,
    vote_average: unreleased ? 0 : 5.5 + ((i * 37) % 40) / 10,
    vote_count: unreleased ? 0 : 100 + i * 13,
    genre_ids: [genre, second],
    popularity: 1000 - i,
  }
}
const ALL = Array.from({ length: FIXTURE_FILM_COUNT }, (_, i) => film(i))
const page = (results: unknown[], p = 1) => ({
  page: p,
  total_pages: 3,
  total_results: results.length * 3,
  results,
})

function providersFor(id: number) {
  const i = id - FIXTURE_FIRST_ID
  if (i % 3 === 2) return {}
  return {
    US: {
      link: `https://www.themoviedb.org/movie/${id}/watch?locale=US`,
      ...(i % 3 === 0 ? { flatrate: [PROVIDERS[0]] } : {}),
      ...(i % 6 === 0 ? { free: [PROVIDERS[2]] } : {}),
      rent: [PROVIDERS[3]],
    },
  }
}

function detail(id: number) {
  const i = id - FIXTURE_FIRST_ID
  const base = film(i)
  return {
    ...base,
    imdb_id: `tt${String(id).padStart(7, '0')}`,
    overview: `A story about ${base.title.toLowerCase()}.`,
    tagline: i % 2 ? 'Some lights are meant to be followed.' : '',
    runtime: 88 + (i % 60),
    revenue: i % 4 ? 123_456_789 : 0,
    genres: base.genre_ids.map((g) => ({
      id: g,
      name: FIXTURE_GENRES.find(([gid]) => gid === g)![1],
    })),
    credits: {
      cast: PEOPLE.map((name, k) => ({
        id: 500 + k,
        name,
        character: `Character ${k + 1}`,
        profile_path: k % 4 === 3 ? null : `/h${k}.jpg`,
      })),
      crew: [
        {
          id: 900,
          name: 'Mara Voss',
          job: 'Director',
          department: 'Directing',
          profile_path: '/h9.jpg',
        },
        { id: 901, name: 'Leo Park', job: 'Screenplay', department: 'Writing' },
        {
          id: 902,
          name: 'Ines Duarte',
          job: 'Director of Photography',
          department: 'Camera',
        },
      ],
    },
    videos: {
      results: [
        { type: 'Teaser', site: 'YouTube', key: 'teaser123', official: true },
        {
          type: 'Trailer',
          site: 'YouTube',
          key: `trailer${id}`,
          official: true,
        },
      ],
    },
    images: {
      backdrops: Array.from({ length: 6 }, (_, k) => ({
        file_path: `/b${FIXTURE_FIRST_ID + ((i + k) % FIXTURE_FILM_COUNT)}.jpg`,
      })),
    },
    release_dates: {
      results: [
        { iso_3166_1: 'US', release_dates: [{ certification: 'PG-13' }] },
      ],
    },
    'watch/providers': { results: providersFor(id) },
    recommendations: page(ALL.slice((i + 3) % 40, ((i + 3) % 40) + 12)),
  }
}

export interface FixtureCall {
  path: string
  params: Record<string, string>
}

export function fixtureSource(): CatalogSource & { calls: FixtureCall[] } {
  const calls: FixtureCall[] = []
  return {
    calls,
    async imdb(imdbId: string): Promise<ImdbScore | null> {
      const n = Number(imdbId.replace(/\D/g, ''))
      return n % 2 ? { rating: 6 + (n % 30) / 10, votes: 1000 + n } : null
    },
    async tmdb<T>(path: string, params: Record<string, string>): Promise<T> {
      calls.push({ path, params })
      const p = Number(params.page || 1)
      const out = (value: unknown) => value as T
      if (path === '/movie/popular') return out(page(ALL.slice(0, 20)))
      if (path === '/movie/now_playing') return out(page(ALL.slice(8, 28)))
      if (path === '/movie/upcoming') return out(page(ALL.slice(16, 36)))
      if (path === '/movie/top_rated') return out(page(ALL.slice(20, 40)))
      if (path.startsWith('/trending/movie/'))
        return out(page(ALL.slice(4, 24)))
      if (path === '/discover/movie') {
        const wanted = (params.with_genres || '')
          .split('|')
          .filter(Boolean)
          .map(Number)
        const pool = wanted.length
          ? ALL.filter((f) => f.genre_ids.some((g) => wanted.includes(g)))
          : ALL
        const start = ((p - 1) * 20) % Math.max(pool.length, 1)
        return out(page(pool.slice(start, start + 20), p))
      }
      if (path === '/genre/movie/list')
        return out({
          genres: FIXTURE_GENRES.map(([id, name]) => ({ id, name })),
        })
      if (path === '/watch/providers/movie') return out({ results: PROVIDERS })
      if (path === '/search/multi') {
        const q = (params.query || '').toLowerCase()
        const films = ALL.filter((f) => f.title.toLowerCase().includes(q))
          .slice(0, 8)
          .map((f) => ({ ...f, media_type: 'movie' }))
        const people = PEOPLE.map((name, k) => ({ id: 500 + k, name }))
          .filter((person) => person.name.toLowerCase().includes(q))
          .map((person) => ({
            ...person,
            media_type: 'person',
            profile_path: `/h${person.id - 500}.jpg`,
            known_for: [{ title: TITLES[person.id % TITLES.length] }],
          }))
        return out(page([...films, ...people], p))
      }
      if (path === '/search/person') {
        const q = (params.query || '').toLowerCase()
        const k = PEOPLE.findIndex((name) => name.toLowerCase().includes(q))
        return out({ results: k === -1 ? [] : [{ id: 500 + k }] })
      }
      let m: RegExpMatchArray | null
      if ((m = path.match(/^\/person\/(\d+)$/))) {
        const k = Number(m[1]) - 500
        if (!PEOPLE[k]) throw new CatalogNotFound(path)
        return out({
          id: 500 + k,
          name: PEOPLE[k],
          biography: `${PEOPLE[k]} is known for quiet, intense performances.`,
          birthday: '1984-02-02',
          profile_path: `/h${k}.jpg`,
          known_for_department: 'Acting',
          movie_credits: {
            cast: ALL.slice(k, k + 12).map((f) => ({
              ...f,
              character: 'Lead',
            })),
            crew: k === 0 ? [{ ...ALL[30], job: 'Director' }] : [],
          },
        })
      }
      if ((m = path.match(/^\/movie\/(\d+)(\/.*)?$/))) {
        const id = Number(m[1])
        if (
          id < FIXTURE_FIRST_ID ||
          id >= FIXTURE_FIRST_ID + FIXTURE_FILM_COUNT
        )
          throw new CatalogNotFound(path)
        if (m[2] === '/watch/providers')
          return out({ results: providersFor(id) })
        if (m[2] === '/external_ids')
          return out({ imdb_id: `tt${String(id).padStart(7, '0')}` })
        if (!m[2]) return out(detail(id))
      }
      throw new CatalogNotFound(path)
    },
  }
}
