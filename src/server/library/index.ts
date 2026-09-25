/**
 * The app's Library, wired to the database and the Catalog. On the server:
 * `library.forMember(userId).save(filmId)` and friends. Types and the rules
 * are client-safe and live in ./types and ./rules.
 */
import { prisma } from '@/server/db'
import { catalog } from '@/server/catalog'
import { createLibrary } from './createLibrary'

export const library = createLibrary({ db: prisma, films: catalog })

export { LibraryError } from './createLibrary'
export { listItemSnapshot } from './snapshot'
export type * from './types'
