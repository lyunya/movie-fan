type Candidate = {
  emsVersionId: string
  tomatoMeter: number | null
  genreIds?: number[]
}
/** All candidates already satisfy hard filters. Roles change selection, not eligibility. */
export function selectTonightPicks<T extends Candidate>(
  pool: T[],
  preferredGenres: number[]
) {
  const overlap = (movie: T, genres: number[]) =>
    (movie.genreIds || []).filter((id) => genres.includes(id)).length
  const fit = (m: T) => overlap(m, preferredGenres) * 30 + (m.tomatoMeter || 0)
  const remaining = [...pool]
  const picks: { movie: T; role: string; reason: string }[] = []
  const take = (movie: T, role: string, reason: string) => {
    picks.push({ movie, role, reason })
    remaining.splice(remaining.indexOf(movie), 1)
  }
  const best = [...remaining].sort((a, b) => fit(b) - fit(a))[0]
  if (!best) return picks
  take(
    best,
    preferredGenres.length ? 'Best fit' : 'Highly rated',
    preferredGenres.length && overlap(best, preferredGenres)
      ? 'Shares genres with films you rated highly'
      : 'One of the highest TMDB scores in this matching pool'
  )
  const familiar = [...remaining]
    .filter((m) => overlap(m, preferredGenres) > 0)
    .sort((a, b) => fit(b) - fit(a))[0]
  if (familiar)
    take(familiar, 'Familiar territory', 'More from genres you have enjoyed')
  const reference = preferredGenres.length
    ? preferredGenres
    : best.genreIds || []
  const wildcard = [...remaining]
    .filter((m) => (m.genreIds || []).some((id) => !reference.includes(id)))
    .sort(
      (a, b) =>
        overlap(a, reference) - overlap(b, reference) ||
        (b.tomatoMeter || 0) - (a.tomatoMeter || 0)
    )[0]
  if (wildcard)
    take(
      wildcard,
      'A different flavor',
      preferredGenres.length
        ? 'Explores beyond your usual genre mix'
        : 'A different genre mix from the first pick'
    )
  for (const movie of [...remaining]) {
    if (picks.length >= 3) break
    take(movie, 'Another good match', 'Popular in this matching pool')
  }
  return picks
}
