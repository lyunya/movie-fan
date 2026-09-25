/**
 * The Recommendations module: Tonight picks and the "For you" row. Both
 * read the Member's taste from their Library (./taste) and ask the Catalog
 * for candidates. Takes the Catalog as an argument so tests use the offline
 * catalog.
 */
import type { Catalog } from '@/server/catalog/createCatalog'
import type { Film } from '@/server/catalog/types'
import { tasteGenres, type TasteEntry } from './taste'
import { selectTonightPicks } from './tonightPicks'

/** What the recommender needs to know about each Library entry. */
export type MemberFilm = TasteEntry & { filmId: string }

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

export function createRecommendations({
  films,
}: {
  films: Pick<Catalog, 'discover' | 'genres'>
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
     * Popular films in the Member's two strongest genres that aren't in
     * their Library yet, and the genre to credit for them.
     */
    async forYou({
      library,
      limit = FOR_YOU_LIMIT,
    }: {
      library: MemberFilm[]
      limit?: number
    }): Promise<{ films: Film[]; topGenre: string | null }> {
      const top = (await genreIds(tasteGenres(library))).slice(0, 2)
      if (!top.length) return { films: [], topGenre: null }
      const { films: found } = await films
        .discover({ genreIds: top.map((g) => g.id), minVotes: 200 })
        .catch(() => ({ films: [] as Film[] }))
      const owned = new Set(library.map((e) => e.filmId))
      return {
        films: found.filter((f) => !owned.has(f.id)).slice(0, limit),
        topGenre: top[0]!.name,
      }
    },
  }
}

export type Recommendations = ReturnType<typeof createRecommendations>
