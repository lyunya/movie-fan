'use client'

/**
 * "Your taste" dashboard computed entirely from the watchlist rows already
 * stored in the DB — no extra API calls. Colors were validated for CVD
 * separation and contrast against the zinc-900 surface:
 *   you = pink #ec4899, critics = sky #0284c7 (both direct-labeled, so
 *   identity never rides on color alone).
 */
import type { FC } from 'react'
import type { WatchListItem } from '@prisma/client'

const YOU_COLOR = '#ec4899'
const CRITICS_COLOR = '#0284c7'
const MAX_GENRE_BARS = 6

interface ProfileStatsProps {
  movies: WatchListItem[]
}

const formatHours = (minutes: number) => {
  const hours = minutes / 60
  return hours >= 10 ? Math.round(hours).toString() : hours.toFixed(1)
}

const ProfileStats: FC<ProfileStatsProps> = ({ movies }) => {
  if (movies.length === 0) return null

  const rated = movies.filter((movie) => movie.userRating)

  // Favorite genres across everything saved
  const genreCounts = new Map<string, number>()
  for (const movie of movies) {
    for (const genre of movie.genres || []) {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1)
    }
  }
  const rankedGenres = [...genreCounts.entries()].sort((a, b) => b[1] - a[1])
  const topGenres = rankedGenres.slice(0, MAX_GENRE_BARS)
  const otherCount = rankedGenres
    .slice(MAX_GENRE_BARS)
    .reduce((sum, [, count]) => sum + count, 0)
  const maxGenreCount = topGenres[0]?.[1] ?? 0

  // Hours watched: runtimes of everything rated as seen
  const minutesWatched = rated.reduce(
    (sum, movie) => sum + (movie.durationMinutes || 0),
    0
  )

  // You vs the critics — both on a 0–100 scale (stars are 1–5)
  const comparable = rated.filter((movie) => movie.tomatoMeter != null)
  const yourAvg =
    comparable.length > 0
      ? Math.round(
          (comparable.reduce((sum, movie) => sum + (movie.userRating || 0), 0) /
            comparable.length) *
            20
        )
      : null
  const criticsAvg =
    comparable.length > 0
      ? Math.round(
          comparable.reduce((sum, movie) => sum + (movie.tomatoMeter || 0), 0) /
            comparable.length
        )
      : null
  const delta = yourAvg != null && criticsAvg != null ? yourAvg - criticsAvg : null

  // Most-watched director among rated movies
  const directorCounts = new Map<string, number>()
  for (const movie of rated) {
    const director = movie.directedBy?.trim()
    if (director) {
      directorCounts.set(director, (directorCounts.get(director) || 0) + 1)
    }
  }
  const topDirector = [...directorCounts.entries()].sort(
    (a, b) => b[1] - a[1]
  )[0]

  // Star-rating distribution (1–5) across rated movies
  const ratingCounts = [1, 2, 3, 4, 5].map(
    (star) => rated.filter((movie) => movie.userRating === star).length
  )
  const maxRatingCount = Math.max(...ratingCounts, 0)

  // Which decades the user actually watches, by release year of rated movies
  const decadeCounts = new Map<number, number>()
  for (const movie of rated) {
    const year = movie.releaseDate
      ? Number(String(movie.releaseDate).slice(0, 4))
      : NaN
    if (!Number.isNaN(year) && year > 1900) {
      const decade = Math.floor(year / 10) * 10
      decadeCounts.set(decade, (decadeCounts.get(decade) || 0) + 1)
    }
  }
  const topDecades = [...decadeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxDecadeCount = topDecades[0]?.[1] ?? 0

  const statTiles = [
    minutesWatched > 0 && {
      label: 'Hours watched',
      value: formatHours(minutesWatched),
      detail: `${rated.length} ${rated.length === 1 ? 'movie' : 'movies'} rated`,
    },
    delta != null && {
      label: 'You vs critics',
      value: delta === 0 ? 'Even' : `${delta > 0 ? '+' : ''}${delta}%`,
      detail:
        delta === 0
          ? 'You agree with TMDB users'
          : delta > 0
            ? 'More generous than TMDB users 🍿'
            : 'Tougher than TMDB users 🧐',
    },
    topDirector && {
      label: 'Top director',
      value: topDirector[0].split(',')[0] ?? topDirector[0],
      detail: `${topDirector[1]} ${topDirector[1] === 1 ? 'movie' : 'movies'} seen`,
      small: true,
    },
  ].filter(Boolean) as {
    label: string
    value: string
    detail: string
    small?: boolean
  }[]

  return (
    <section aria-label="Your taste in numbers" className="mb-10">
      <h2 className="section-heading mb-4">
        <span className="gradient-text">Your taste</span>
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* KPI tiles */}
        {statTiles.map((tile) => (
          <div key={tile.label} className="surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {tile.label}
            </p>
            <p
              className={`mt-1 font-heading font-bold text-white ${
                tile.small ? 'truncate text-2xl' : 'text-4xl'
              }`}
            >
              {tile.value}
            </p>
            <p className="mt-1 text-sm text-zinc-400">{tile.detail}</p>
          </div>
        ))}

        {/* Favorite genres — single-series horizontal bars, direct-labeled */}
        {topGenres.length > 0 && (
          <div className="surface p-5 md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Favorite genres
            </p>
            <ul className="mt-3 flex flex-col gap-2.5">
              {topGenres.map(([genre, count]) => (
                <li
                  key={genre}
                  className="flex items-center gap-3"
                  title={`${genre} — ${count} ${count === 1 ? 'movie' : 'movies'}`}
                >
                  <span className="w-28 shrink-0 truncate text-sm text-zinc-300">
                    {genre}
                  </span>
                  <span className="relative h-3 flex-1 overflow-hidden rounded-full bg-zinc-800">
                    <span
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${Math.max((count / maxGenreCount) * 100, 6)}%`,
                        backgroundColor: YOU_COLOR,
                      }}
                    />
                  </span>
                  <span className="w-6 shrink-0 text-right text-sm tabular-nums text-zinc-400">
                    {count}
                  </span>
                </li>
              ))}
              {otherCount > 0 && (
                <li className="flex items-center gap-3 text-zinc-500">
                  <span className="w-28 shrink-0 text-sm">Other</span>
                  <span className="relative h-3 flex-1 overflow-hidden rounded-full bg-zinc-800">
                    <span
                      className="absolute inset-y-0 left-0 rounded-full bg-zinc-600"
                      style={{
                        width: `${Math.max((otherCount / maxGenreCount) * 100, 6)}%`,
                      }}
                    />
                  </span>
                  <span className="w-6 shrink-0 text-right text-sm tabular-nums">
                    {otherCount}
                  </span>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* You vs critics — two direct-labeled bars on the same 0–100 scale */}
        {yourAvg != null && criticsAvg != null && (
          <div className="surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Average score
            </p>
            <ul className="mt-3 flex flex-col gap-3">
              {[
                { label: 'You', value: yourAvg, color: YOU_COLOR },
                { label: 'TMDB users', value: criticsAvg, color: CRITICS_COLOR },
              ].map((row) => (
                <li key={row.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-zinc-300">
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      {row.label}
                    </span>
                    <span className="tabular-nums text-zinc-400">
                      {row.value}%
                    </span>
                  </div>
                  <div
                    className="relative h-3 overflow-hidden rounded-full bg-zinc-800"
                    title={`${row.label}: ${row.value}%`}
                  >
                    <span
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${row.value}%`,
                        backgroundColor: row.color,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-zinc-500">
              Across {comparable.length} rated{' '}
              {comparable.length === 1 ? 'movie' : 'movies'} with a TMDB score
            </p>
          </div>
        )}

        {/* Your ratings — distribution of 1–5 star scores */}
        {rated.length > 0 && (
          <div className="surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Your ratings
            </p>
            <ul className="mt-3 flex flex-col gap-2.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingCounts[star - 1] ?? 0
                return (
                  <li
                    key={star}
                    className="flex items-center gap-3"
                    title={`${star} star${star === 1 ? '' : 's'} — ${count} ${count === 1 ? 'movie' : 'movies'}`}
                  >
                    <span className="w-10 shrink-0 text-sm tabular-nums text-yellow-400">
                      {star}★
                    </span>
                    <span className="relative h-3 flex-1 overflow-hidden rounded-full bg-zinc-800">
                      <span
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          width: `${
                            maxRatingCount > 0
                              ? Math.max(
                                  (count / maxRatingCount) * 100,
                                  count > 0 ? 6 : 0
                                )
                              : 0
                          }%`,
                          backgroundColor: YOU_COLOR,
                        }}
                      />
                    </span>
                    <span className="w-6 shrink-0 text-right text-sm tabular-nums text-zinc-400">
                      {count}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Favorite decades — by release year of rated movies */}
        {topDecades.length > 0 && (
          <div className="surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Favorite decades
            </p>
            <ul className="mt-3 flex flex-col gap-2.5">
              {topDecades.map(([decade, count]) => (
                <li
                  key={decade}
                  className="flex items-center gap-3"
                  title={`${decade}s — ${count} ${count === 1 ? 'movie' : 'movies'}`}
                >
                  <span className="w-16 shrink-0 text-sm tabular-nums text-zinc-300">
                    {decade}s
                  </span>
                  <span className="relative h-3 flex-1 overflow-hidden rounded-full bg-zinc-800">
                    <span
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${Math.max((count / maxDecadeCount) * 100, 6)}%`,
                        backgroundColor: YOU_COLOR,
                      }}
                    />
                  </span>
                  <span className="w-6 shrink-0 text-right text-sm tabular-nums text-zinc-400">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

export default ProfileStats
