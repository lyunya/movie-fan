/**
 * How much of a filmography a Member has Watched. A person credited twice on
 * one Film (directing and acting) counts once overall. Credits with no year
 * are unreleased or undated, so they aren't something to have "missed".
 */
export interface CompletionCredit {
  filmId: string
  year: string | null
  role: string
}

export interface Completion {
  seen: number
  total: number
  /** 0–100 */
  percent: number
}

const progress = (ids: Set<string>, watched: ReadonlySet<string>) => {
  const seen = [...ids].filter((id) => watched.has(id)).length
  return {
    seen,
    total: ids.size,
    percent: ids.size ? Math.round((seen / ids.size) * 100) : 0,
  }
}

export function filmographyCompletion(
  credits: readonly CompletionCredit[],
  watched: ReadonlySet<string>
): { all: Completion; byRole: Record<string, Completion> } {
  const all = new Set<string>()
  const roles = new Map<string, Set<string>>()
  for (const credit of credits) {
    if (!credit.year) continue
    all.add(credit.filmId)
    if (!roles.has(credit.role)) roles.set(credit.role, new Set())
    roles.get(credit.role)!.add(credit.filmId)
  }
  return {
    all: progress(all, watched),
    byRole: Object.fromEntries(
      [...roles].map(([role, ids]) => [role, progress(ids, watched)])
    ),
  }
}
