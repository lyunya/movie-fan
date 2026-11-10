/**
 * Catalog reads whose answer is the same for everyone: they never look at
 * the session. A request made only of these skips the session lookup (a
 * database query) and may be cached by the CDN, so repeated searches and
 * where-to-watch checks stop being function invocations.
 *
 * Only add a procedure here if it ignores `ctx.session` entirely.
 */
const PUBLIC_READS: Record<string, number> = {
  'catalog.search': 3600,
  'catalog.providers': 86400,
  'catalog.person': 86400,
  'catalog.details': 3600,
  'catalog.discoverByGenre': 3600,
  'availability.whereToWatch': 3600,
}

/** Seconds a request for these procedures may be cached, or null if any is personal. */
export function publicCacheSeconds(paths: readonly string[]): number | null {
  if (!paths.length) return null
  let seconds = Infinity
  for (const path of paths) {
    const ttl = PUBLIC_READS[path]
    if (ttl === undefined) return null
    seconds = Math.min(seconds, ttl)
  }
  return seconds
}
