/**
 * Where to send someone after sign-in. Only ever a path on this site: a
 * same-origin absolute URL is reduced to its path, and anything a browser
 * could read as another host ("//evil.example", "/\\evil.example", control
 * characters) falls back to the home page.
 */
export function safeCallbackUrl(
  value: string | string[] | undefined,
  siteUrl: string
): string {
  const candidate = Array.isArray(value) ? value[0] : value
  if (!candidate) return '/'
  try {
    const site = new URL(siteUrl)
    // Resolve the way a browser would, then require that it stayed here
    const url = new URL(candidate, site)
    if (url.origin !== site.origin) return '/'
    if (/[\\\u0000-\u001f]/.test(candidate)) return '/'
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/'
  }
}
