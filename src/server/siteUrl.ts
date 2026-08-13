/**
 * The canonical public origin for building absolute URLs (metadata, sitemap,
 * robots, JSON-LD). Prefers an explicit SITE_URL, then the Auth.js origin,
 * then the local development server. No trailing slash.
 */
export const getSiteUrl = (): string => {
  const explicit = process.env.SITE_URL
  if (explicit) return explicit.replace(/\/$/, '')
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, '')
  return 'http://localhost:3000'
}
