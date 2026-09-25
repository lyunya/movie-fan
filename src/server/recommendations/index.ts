/** The app's recommender, wired to the Catalog. */
import { catalog } from '@/server/catalog'
import { createRecommendations } from './createRecommendations'

export const recommendations = createRecommendations({ films: catalog })

export type {
  MemberFilm,
  TonightFilters,
  TonightPick,
} from './createRecommendations'
