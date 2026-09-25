/**
 * TMDB serves every image at several fixed widths. Because Next image
 * optimization is intentionally off (see next.config.mjs), the rendition in
 * the URL is exactly what the browser downloads — so pick the smallest one
 * that still looks sharp at 2x DPR instead of reusing whatever size a URL was
 * stored with (watchlist rows in the DB carry w500 posters).
 */
export type TmdbImageSize =
  'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original'

const TMDB_SIZE_SEGMENT = /(image\.tmdb\.org\/t\/p\/)[^/]+\//

export const tmdbImage = <T extends string | null | undefined>(
  url: T,
  size: TmdbImageSize
): T => (url ? (url.replace(TMDB_SIZE_SEGMENT, `$1${size}/`) as T) : url)
