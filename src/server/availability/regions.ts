/**
 * The Regions the app offers for where-to-watch. Client-safe.
 */
export const REGIONS = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'IE', name: 'Ireland' },
  { code: 'NZ', name: 'New Zealand' },
] as const

export type RegionCode = (typeof REGIONS)[number]['code']

export const REGION_CODES = REGIONS.map((r) => r.code) as [
  RegionCode,
  ...RegionCode[],
]

export const DEFAULT_REGION: RegionCode = 'US'

export const isRegion = (code: string | null | undefined): code is RegionCode =>
  REGION_CODES.includes(code as RegionCode)

/**
 * A guest's likely Region from their browser languages ("en-GB" → GB),
 * or the default when none of them names a Region we offer.
 */
export function guessRegion(languages: readonly string[]): RegionCode {
  for (const language of languages) {
    const region = language.split('-')[1]?.toUpperCase()
    if (isRegion(region)) return region
  }
  return DEFAULT_REGION
}
