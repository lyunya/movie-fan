/** Member views against a real Postgres (npm run test:integration). */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { createMembers } from './createMembers'

const enabled = process.env.RUN_INTEGRATION === '1'
const db = new PrismaClient()
const id = 'member-test-cara'
const cara = createMembers(db).forMember(id)

describe.skipIf(!enabled)('Member', () => {
  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL || '')
    if (!['localhost', '127.0.0.1'].includes(url.hostname))
      throw new Error('Integration tests require an isolated local database')
    await db.user.upsert({
      where: { id },
      update: {},
      create: {
        id,
        name: 'Cara',
        email: 'cara@example.test',
        watchRegion: 'XX',
      },
    })
  })
  afterAll(async () => {
    await db.user.deleteMany({ where: { id } })
    await db.$disconnect()
  })

  it('never hands out the email address or the raw row', async () => {
    const views = [await cara.preferences(), await cara.profile()]
    for (const view of views) {
      expect(JSON.stringify(view)).not.toContain('cara@example.test')
      expect(view).not.toHaveProperty('emailVerified')
    }
    for (const write of [
      await cara.setPublic(true),
      await cara.setStreamAlerts(true),
      await cara.setNewsTopics({ newsTopics: ['Ada'], mutedNewsTopics: [] }),
    ])
      expect(write).toEqual({ id })
  })

  it('reads preferences in the app’s terms', async () => {
    expect((await cara.preferences()).region).toBe('US') // unknown → default
    await cara.setStreaming({ region: 'NZ', services: [8, 337] })
    expect(await cara.preferences()).toMatchObject({
      region: 'NZ',
      services: [8, 337],
    })
    expect(await cara.profile()).toMatchObject({
      name: 'Cara',
      isPublic: true,
      streamAlerts: true,
    })
  })
})
