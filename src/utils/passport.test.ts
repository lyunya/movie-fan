import { describe, expect, it } from 'vitest'
import { computePassport, stampTilt, type PassportMovie } from './passport'

const m = (over: Partial<PassportMovie>): PassportMovie => ({
  movieId: Math.random().toString(),
  name: 'Film',
  releaseDate: '2001-01-01',
  genres: ['Drama'],
  durationMinutes: 120,
  directedBy: 'A Director',
  userRating: null,
  watched: true,
  favorite: false,
  ...over,
})

describe('computePassport', () => {
  it('stamps decades and genres only for watched films', () => {
    const p = computePassport([
      m({ name: 'Old', releaseDate: '1955-06-01', genres: ['Western'] }),
      m({ name: 'Saved only', releaseDate: '1972-01-01', watched: false }),
      m({
        name: 'Rated',
        releaseDate: '1999-01-01',
        watched: false,
        userRating: 4,
      }),
    ])
    const earned = (k: string) =>
      [...p.decades, ...p.genres].find((s) => s.key === k)?.earned
    expect(earned('decade-1950')).toBe(true)
    expect(earned('decade-1970')).toBe(false)
    expect(earned('decade-1990')).toBe(true)
    expect(earned('genre-37')).toBe(true)
    expect(p.watchedCount).toBe(2)
  })

  it('folds pre-1920s films into the 1920s stamp and captions with the earliest film', () => {
    const p = computePassport([
      m({ name: 'Later', releaseDate: '1927-01-01' }),
      m({ name: 'Nosferatu-ish', releaseDate: '1922-03-04' }),
      m({ name: 'Trip to the Moon-ish', releaseDate: '1902-09-01' }),
    ])
    const twenties = p.decades.find((d) => d.key === 'decade-1920')!
    expect(twenties.count).toBe(3)
    expect(twenties.firstTitle).toBe('Trip to the Moon-ish')
  })

  it('tracks milestone visas', () => {
    const films = [1950, 1960, 1970, 1980, 1990].map((y, i) =>
      m({
        releaseDate: `${y}-01-01`,
        directedBy: i < 3 ? 'Same Person' : 'Someone Else',
        durationMinutes: 300,
      })
    )
    const visas = Object.fromEntries(
      computePassport(films).visas.map((v) => [v.key, v])
    )
    expect(visas['time-traveler']!.earned).toBe(true)
    expect(visas['auteur']!.earned).toBe(true)
    expect(visas['marathon']!.earned).toBe(true)
    expect(visas['archivist']!.earned).toBe(true)
    expect(visas['regular']!.progress).toBe(5)
    expect(visas['regular']!.earned).toBe(false)
  })

  it('handles missing dates and an empty library', () => {
    const p = computePassport([m({ releaseDate: null })])
    expect(p.decades.every((d) => !d.earned)).toBe(true)
    expect(computePassport([]).stampCount).toBe(0)
  })

  it('tilts stamps deterministically within a small range', () => {
    expect(stampTilt('decade-1980')).toBe(stampTilt('decade-1980'))
    expect(Math.abs(stampTilt('genre-27'))).toBeLessThanOrEqual(6.6)
  })
})
