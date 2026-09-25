/**
 * The Availability module: where a Film can be watched, and which of a
 * Member's Films they can stream right now.
 *
 * A Film counts as available when it's included with one of the Member's
 * services (any subscription service when they haven't picked any), or
 * free, with or without ads, since anyone can watch those.
 */
import type { Catalog } from '@/server/catalog/createCatalog'
import type { Provider, WhereToWatch } from '@/server/catalog/types'

export interface StreamingPrefs {
  region: string
  /** Chosen service ids; empty means any subscription service */
  services: number[]
}

export interface Streaming {
  filmId: string
  /** Service names, subscription first */
  services: string[]
}

/** The ways to watch a Film at no extra cost for this Member. */
export function streamingOptions(
  where: WhereToWatch | null,
  services: number[]
): Provider[] {
  if (!where) return []
  const seen = new Set<number>()
  return [
    ...where.subscription.filter(
      (p) => !services.length || services.includes(p.id)
    ),
    ...where.free,
    ...where.ads,
  ].filter((p) => !seen.has(p.id) && !!seen.add(p.id))
}

/**
 * Run `work` over `items` with at most `limit` in flight, in order. With
 * `until`, stops starting new work once it returns true.
 */
export async function pooled<T, R>(
  items: readonly T[],
  limit: number,
  work: (item: T) => Promise<R>,
  until?: (done: R[]) => boolean
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += limit) {
    results.push(...(await Promise.all(items.slice(i, i + limit).map(work))))
    if (until?.(results)) break
  }
  return results
}

const CONCURRENCY = 5

export function createAvailability({
  films,
}: {
  films: Pick<Catalog, 'whereToWatch'>
}) {
  return {
    /** Every way to watch one Film in a Region; null when TMDB lists none. */
    whereToWatch: (filmId: string, region: string) =>
      films.whereToWatch(filmId, region),

    /**
     * Which of these Films the Member can stream, in the given order. A
     * lookup that fails is reported in `failed`, never as "not streaming".
     * With `want`, stops once that many are found.
     */
    async streamingFor(
      filmIds: readonly string[],
      prefs: StreamingPrefs,
      { want }: { want?: number } = {}
    ): Promise<{ available: Streaming[]; failed: string[]; checked: number }> {
      const results = await pooled(
        filmIds,
        CONCURRENCY,
        async (filmId) => {
          try {
            const where = await films.whereToWatch(filmId, prefs.region)
            const options = streamingOptions(where, prefs.services)
            return { filmId, services: options.map((p) => p.name), ok: true }
          } catch {
            return { filmId, services: [], ok: false }
          }
        },
        want
          ? (done) => done.filter((r) => r.services.length).length >= want
          : undefined
      )
      const available = results
        .filter((r) => r.services.length)
        .map(({ filmId, services }) => ({ filmId, services }))
      return {
        available: want ? available.slice(0, want) : available,
        failed: results.filter((r) => !r.ok).map((r) => r.filmId),
        checked: results.length,
      }
    },
  }
}

export type Availability = ReturnType<typeof createAvailability>
