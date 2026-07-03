/**
 * Helpers for `<id>-<name>` URL slugs used by genre and person routes
 * (e.g. `/genre/878-science-fiction`, `/person/287-brad-pitt`). The leading
 * integer id is authoritative; the name suffix is cosmetic and SEO-friendly.
 */
export const slugify = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/** Extract the leading integer id from a slug, or null if there isn't one. */
export const parseIdFromSlug = (slug: string): number | null => {
  const match = decodeURIComponent(slug).match(/^(\d+)/)
  return match ? Number(match[1]) : null
}

/** Build an `<id>-<name>` slug. */
export const toSlug = (id: number | string, name: string): string => {
  const suffix = slugify(name)
  return suffix ? `${id}-${suffix}` : String(id)
}
