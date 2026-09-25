/** The app's Availability, wired to the Catalog. Regions are client-safe in ./regions. */
import { catalog } from '@/server/catalog'
import { createAvailability } from './createAvailability'

export const availability = createAvailability({ films: catalog })

export type { StreamingPrefs, Streaming } from './createAvailability'
export * from './regions'
