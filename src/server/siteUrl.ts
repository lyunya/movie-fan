/**
 * The canonical public origin for building absolute URLs (metadata, sitemap,
 * robots, JSON-LD). Prefers an explicit SITE_URL, then Vercel's per-deploy
 * host, then localhost for dev. No trailing slash.
 */
export const getSiteUrl = (): string => {
  const explicit = process.env.SITE_URL
  if (explicit) return explicit.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}
