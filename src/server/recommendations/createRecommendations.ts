/**
 * The Recommendations module: Tonight picks and the "For you" row. Both
 * read the Member's taste from their Library (./taste) and ask the Catalog
 * for candidates. Takes the Catalog as an argument so tests use the offline
 * catalog.
 */
import type { Catalog } from '@/server/catalog/createCatalog'
import type { Film } from '@/server/catalog/types'
import { isLoved, tasteGenres, type TasteEntry } from './taste'
import { selectTonightPicks } from './tonightPicks'

/** What the recommender needs to know about each Library entry. */
export type MemberFilm = TasteEntry & { filmId: string; title?: string }

export interface TonightFilters {
  genreIds: number[]
  maxRuntime?: number
  /** Minimum TMDB score, 0–100 */
  minScore: number
  region: string
  /** Services to stream on; undefined means any way of watching */
  streamingOn?: number[]
  /** 0 for the first pool; each "surprise me" moves one page further */
  surprise: number
}

export interface TonightPick {
  film: Film
  role: string
  reason: string
}

const FOR_YOU_LIMIT = 20
/** How many Loved films seed the "For you" row */
const FOR_YOU_SEEDS = 3

export function createRecommendations({
  films,
}: {
  films: Pick<Catalog, 'discover' | 'genres' | 'similarTo'>
}) {
  /** Catalog genre ids for genre names, in the same order; unknown names drop out. */
  const genreIds = async (names: string[]) => {
    if (!names.length) return []
    const known = new Map(
      (await films.genres().catch(() => [])).map((g) => [
        g.name.toLowerCase(),
        g.id,
      ])
    )
    return names
      .map((name) => ({ name, id: known.get(name.toLowerCase()) }))
      .filter((g): g is { name: string; id: number } => g.id != null)
  }

  return {
    /**
     * Up to three films for tonight, each with a role and a reason. Films
     * the Member has watched (unless saved again), dismissed, or was just
     * shown (`excludeIds`) are left out.
     */
    async pickTonight({
      library,
      filters,
      excludeIds = [],
      today = new Date().toISOString().slice(0, 10),
    }: {
      library: MemberFilm[]
      filters: TonightFilters
      excludeIds?: string[]
      today?: string
    }): Promise<TonightPick[]> {
      const [{ films: pool }, preferred] = await Promise.all([
        films.discover({
          region: filters.region,
          streamingOn: filters.streamingOn,
          genreIds: filters.genreIds,
          maxRuntime: filters.maxRuntime,
          minScore: filters.minScore,
          minVotes: 100,
          releasedBy: today,
          page: 1 + filters.surprise,
        }),
        genreIds(tasteGenres(library).slice(0, 4)),
      ])
      const excluded = new Set([
        ...library
          .filter((e) => e.dismissed || (e.watched && !e.inWatchlist))
          .map((e) => e.filmId),
        ...excludeIds,
      ])
      const watchlist = new Set(
        library.filter((e) => e.inWatchlist).map((e) => e.filmId)
      )
      const context = [
        filters.maxRuntime ? `Up to ${filters.maxRuntime} minutes` : null,
        filters.streamingOn?.length
          ? 'On your selected services'
          : 'Matches your filters',
        `TMDB ${filters.minScore}% or higher`,
      ]
        .filter(Boolean)
        .join(' · ')
      return selectTonightPicks(
        pool.filter((f) => !excluded.has(f.id)),
        preferred.map((g) => g.id),
        watchlist
      ).map((pick) => ({ ...pick, reason: `${pick.reason}. ${context}` }))
    },

    /**
     * Films the Member doesn't have yet, led by ones similar to the Films
     * they Loved most recently (`library` is expected newest first), then
     * topped up with popular films in their two strongest genres.
     * `becauseOf` names the Loved films that actually contributed.
     */
    async forYou({
      library,
      limit = FOR_YOU_LIMIT,
    }: {
      library: MemberFilm[]
      limit?: number
    }): Promise<{
      films: Film[]
      topGenre: string | null
      becauseOf: string[]
    }> {
      const seeds = library
        .filter((e) => !e.dismissed && isLoved(e))
        .slice(0, FOR_YOU_SEEDS)
      const [top, ...similar] = await Promise.all([
        genreIds(tasteGenres(library)).then((g) => g.slice(0, 2)),
        ...seeds.map((seed) =>
          films.similarTo(seed.filmId).catch(() => [] as Film[])
        ),
      ])
      const taken = new Set(library.map((e) => e.filmId))
      const picked: Film[] = []
      const take = (film: Film | undefined) => {
        if (!film || taken.has(film.id) || picked.length >= limit) return false
        taken.add(film.id)
        picked.push(film)
        return true
      }
      // One from each seed in turn, so no single film dominates the row
      const contributed = new Set<number>()
      const longest = Math.max(0, ...similar.map((list) => list.length))
      for (let i = 0; i < longest && picked.length < limit; i++)
        similar.forEach((list, s) => {
          if (take(list[i])) contributed.add(s)
        })
      if (picked.length < limit && top.length) {
        const { films: found } = await films
          .discover({ genreIds: top.map((g) => g.id), minVotes: 200 })
          .catch(() => ({ films: [] as Film[] }))
        found.forEach(take)
      }
      return {
        films: picked,
        topGenre: top[0]?.name ?? null,
        becauseOf: seeds
          .filter((seed, s) => contributed.has(s) && seed.title)
          .map((seed) => seed.title!),
      }
    },
  }
}

export type Recommendations = ReturnType<typeof createRecommendations>
