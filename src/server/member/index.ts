/** The app's Members, wired to the database. */
import { prisma } from '@/server/db'
import { createMembers } from './createMembers'

export const members = createMembers(prisma)

export type { MemberPreferences, MemberProfile } from './createMembers'
