import type { Image } from '@/types/main'

/**
 * Resolve a usable poster URL from the two shapes the app carries:
 * a plain string (watchlist rows from the DB) or an `{ url }` object whose
 * url may be missing (live API results). Falls back to the local placeholder
 * so an <Image> always has a valid src.
 */
export const getPosterSrc = (
  posterImage: Image | string | null | undefined
): string => {
  const url =
    typeof posterImage === 'string' ? posterImage : posterImage?.url
  return url || '/placeholderposter.png'
}
