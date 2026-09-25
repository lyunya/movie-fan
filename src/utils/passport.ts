/**
 * Film Passport: turns a library into collectible stamps — one per decade and
 * per genre you've actually watched — plus a few milestone "visas". Computed
 * entirely from the library the client already has, so it costs no extra
 * requests. Pure so it can be unit-tested.
 */
export interface PassportMovie {
  movieId: string
  name: string
  releaseDate: string | null
  genres: string[]
  durationMinutes: number
  directedBy: string
  userRating: number | null
  watched: boolean
  favorite: boolean
}

/** TMDB's movie genres, with ids for linking to genre pages. */
export const PASSPORT_GENRES: [number, string][] = [
  [28, 'Action'],
  [12, 'Adventure'],
  [16, 'Animation'],
  [35, 'Comedy'],
  [80, 'Crime'],
  [99, 'Documentary'],
  [18, 'Drama'],
  [10751, 'Family'],
  [14, 'Fantasy'],
  [36, 'History'],
  [27, 'Horror'],
  [10402, 'Music'],
  [9648, 'Mystery'],
  [10749, 'Romance'],
  [878, 'Science Fiction'],
  [53, 'Thriller'],
  [10752, 'War'],
  [37, 'Western'],
]

export const PASSPORT_DECADES = [
  1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020,
]

export interface Stamp {
  key: string
  label: string
  count: number
  earned: boolean
  /** First film that earned it (by release date), for the stamp's caption */
  firstTitle: string | null
  genreId?: number
}

export interface Visa {
  key: string
  label: string
  description: string
  progress: number
  goal: number
  earned: boolean
}

export interface Passport {
  watchedCount: number
  hours: number
  decades: Stamp[]
  genres: Stamp[]
  visas: Visa[]
  stampCount: number
  totalStamps: number
}

const isWatched = (m: PassportMovie) =>
  m.watched || (m.userRating != null && m.userRating > 0)

const yearOf = (m: PassportMovie) => {
  const year = Number(m.releaseDate?.slice(0, 4))
  return Number.isFinite(year) && year > 1800 ? year : null
}

export function computePassport(movies: PassportMovie[]): Passport {
  const watched = movies.filter(isWatched)

  const decades: Stamp[] = PASSPORT_DECADES.map((decade) => {
    const films = watched
      .filter((m) => {
        const y = yearOf(m)
        // The 1920s stamp also covers anything earlier: silent-era credit
        return (
          y != null &&
          (decade === 1920 ? y < 1930 : y >= decade && y < decade + 10)
        )
      })
      .sort((a, b) => (a.releaseDate || '').localeCompare(b.releaseDate || ''))
    return {
      key: `decade-${decade}`,
      label: `${decade}s`,
      count: films.length,
      earned: films.length > 0,
      firstTitle: films[0]?.name ?? null,
    }
  })

  const genres: Stamp[] = PASSPORT_GENRES.map(([id, name]) => {
    const films = watched.filter((m) => m.genres?.includes(name))
    return {
      key: `genre-${id}`,
      label: name,
      count: films.length,
      earned: films.length > 0,
      firstTitle: films[0]?.name ?? null,
      genreId: id,
    }
  })

  const minutes = watched.reduce((s, m) => s + (m.durationMinutes || 0), 0)
  const directorCounts = new Map<string, number>()
  for (const m of watched)
    for (const d of (m.directedBy || '').split(',').map((x) => x.trim()))
      if (d) directorCounts.set(d, (directorCounts.get(d) || 0) + 1)
  const topDirector = Math.max(0, ...directorCounts.values())
  const rated = watched.filter((m) => m.userRating).length
  const earnedDecades = decades.filter((d) => d.earned).length
  const oldest = Math.min(
    ...watched.map((m) => yearOf(m) ?? Infinity),
    Infinity
  )

  const visa = (
    key: string,
    label: string,
    description: string,
    progress: number,
    goal: number
  ): Visa => ({
    key,
    label,
    description,
    progress: Math.min(progress, goal),
    goal,
    earned: progress >= goal,
  })

  const visas: Visa[] = [
    visa('first-reel', 'First Reel', 'Log your first film', watched.length, 1),
    visa('regular', 'Regular', 'Watch 25 films', watched.length, 25),
    visa('centurion', 'Centurion', 'Watch 100 films', watched.length, 100),
    visa(
      'marathon',
      'Marathoner',
      'Spend 24 hours at the movies',
      Math.floor(minutes / 60),
      24
    ),
    visa(
      'time-traveler',
      'Time Traveler',
      'Watch films from 5 different decades',
      earnedDecades,
      5
    ),
    visa(
      'auteur',
      'Auteur Tracker',
      'Watch 3 films by the same director',
      topDirector,
      3
    ),
    visa('critic', 'Critic', 'Rate 25 films', rated, 25),
    visa(
      'archivist',
      'Archivist',
      'Watch a film made before 1960',
      oldest < 1960 ? 1 : 0,
      1
    ),
  ]

  const stampCount =
    decades.filter((s) => s.earned).length +
    genres.filter((s) => s.earned).length
  return {
    watchedCount: watched.length,
    hours: Math.round(minutes / 60),
    decades,
    genres,
    visas,
    stampCount,
    totalStamps: decades.length + genres.length,
  }
}

/** Stable little rotation per stamp so the page looks hand-stamped. */
export const stampTilt = (key: string) => {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0
  return ((Math.abs(h) % 13) - 6) * 1.1
}
