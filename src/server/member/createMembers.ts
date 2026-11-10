/**
 * What the app keeps about a Member besides their Library: their
 * preferences (Region, services, news topics) and their public profile.
 * Reads return these views only — never the email address or the raw row.
 */
import type { PrismaClient } from '@prisma/client'
import {
  DEFAULT_REGION,
  isRegion,
  type RegionCode,
} from '@/server/availability/regions'

export interface MemberPreferences {
  region: RegionCode
  /** Chosen streaming service ids; empty means any */
  services: number[]
  newsTopics: string[]
  mutedNewsTopics: string[]
}

export interface MemberProfile {
  id: string
  name: string | null
  handle: string | null
  bio: string | null
  image: string | null
  /** Watchlist and public diary entries visible at /u/<handle> */
  isPublic: boolean
  /** Email when a Watchlist film starts streaming */
  streamAlerts: boolean
}

export function createMembers(db: PrismaClient) {
  return {
    forMember(memberId: string) {
      const where = { id: memberId }
      const update = (data: Parameters<typeof db.user.update>[0]['data']) =>
        db.user.update({ where, data, select: { id: true } })
      return {
        async preferences(): Promise<MemberPreferences> {
          const u = await db.user.findUniqueOrThrow({
            where,
            select: {
              watchRegion: true,
              preferredProviders: true,
              newsTopics: true,
              mutedNewsTopics: true,
            },
          })
          return {
            region: isRegion(u.watchRegion) ? u.watchRegion : DEFAULT_REGION,
            services: u.preferredProviders,
            newsTopics: u.newsTopics,
            mutedNewsTopics: u.mutedNewsTopics,
          }
        },

        async profile(): Promise<MemberProfile> {
          const u = await db.user.findUniqueOrThrow({
            where,
            select: {
              id: true,
              name: true,
              handle: true,
              bio: true,
              image: true,
              publicWatchlist: true,
              streamAlerts: true,
            },
          })
          return {
            id: u.id,
            name: u.name,
            handle: u.handle,
            bio: u.bio,
            image: u.image,
            isPublic: u.publicWatchlist,
            streamAlerts: u.streamAlerts,
          }
        },

        /**
         * Remove the Member and everything they made: Library, Diary, Lists,
         * connections, bookmarks, sessions and sign-in links. Not undoable.
         */
        async deleteAccount(): Promise<void> {
          await db.$transaction([
            // Explicit, so this works whether or not the cascade is in place
            db.watchListItem.deleteMany({ where: { userId: memberId } }),
            db.streamingDelivery.deleteMany({ where: { userId: memberId } }),
            db.user.delete({ where }),
          ])
        },

        updateProfile: (p: { name: string; handle: string; bio: string }) =>
          update(p),
        setPublic: (isPublic: boolean) => update({ publicWatchlist: isPublic }),
        setStreamAlerts: (enabled: boolean) =>
          update({ streamAlerts: enabled }),
        setStreaming: (p: { region: RegionCode; services: number[] }) =>
          update({ watchRegion: p.region, preferredProviders: p.services }),
        setNewsTopics: (p: {
          newsTopics: string[]
          mutedNewsTopics: string[]
        }) => update(p),
      }
    },
  }
}
