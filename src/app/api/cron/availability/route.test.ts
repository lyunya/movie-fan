import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({
  users: vi.fn(),
  items: vi.fn(),
  itemUpdate: vi.fn(),
  itemUpdateMany: vi.fn(),
  deliveryCreate: vi.fn(),
  claim: vi.fn(),
  deliveryUpdate: vi.fn(),
  transaction: vi.fn(),
  providers: vi.fn(),
  send: vi.fn(),
}))
vi.mock('@/server/db', () => ({
  prisma: {
    user: { findMany: mocks.users },
    watchListItem: {
      findMany: mocks.items,
      update: mocks.itemUpdate,
      updateMany: mocks.itemUpdateMany,
    },
    streamingDelivery: {
      createMany: mocks.deliveryCreate,
      updateMany: mocks.claim,
      update: mocks.deliveryUpdate,
    },
    $transaction: mocks.transaction,
  },
}))
vi.mock('@/server/tmdb', () => ({ fetchMovieAvailability: mocks.providers }))
vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail: mocks.send }) },
}))
vi.mock('@/env/server.mjs', () => ({
  env: {
    CRON_SECRET: 'test-secret',
    EMAIL_SERVER_PORT: '25',
    EMAIL_FROM: 'test@example.test',
  },
}))
vi.mock('@/server/siteUrl', () => ({
  getSiteUrl: () => 'https://example.test',
}))
import { GET } from './route'
const request = () =>
  new Request('https://example.test/api/cron/availability', {
    headers: { authorization: 'Bearer test-secret' },
  })
beforeEach(() => {
  vi.resetAllMocks()
  mocks.users.mockResolvedValue([
    {
      id: 'u',
      email: 'a@example.test',
      watchRegion: 'CA',
      preferredProviders: [8],
    },
  ])
  mocks.items.mockResolvedValue([
    { id: 'i', movieId: '1', name: '<Film>', hasStreaming: false },
  ])
  mocks.providers.mockResolvedValue({ flatrate: [{ id: 8, name: 'Netflix' }] })
  mocks.claim.mockResolvedValue({ count: 1 })
})
describe('streaming alert delivery', () => {
  it('rejects unauthenticated cron calls without reading data', async () => {
    expect((await GET(new Request('https://example.test'))).status).toBe(401)
    expect(mocks.users).not.toHaveBeenCalled()
  })
  it('uses region and services and commits only after sending', async () => {
    await GET(request())
    expect(mocks.providers).toHaveBeenCalledWith('1', 'CA')
    expect(mocks.send.mock.calls[0]?.[0].html).toContain('&lt;Film&gt;')
    expect(mocks.send.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.itemUpdateMany.mock.invocationCallOrder[0]!
    )
    expect(mocks.deliveryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'SENT' }),
      })
    )
  })
  it('does not send for a provider outside the selected services', async () => {
    mocks.providers.mockResolvedValue({ flatrate: [{ id: 9 }] })
    await GET(request())
    expect(mocks.send).not.toHaveBeenCalled()
  })
  it('preserves known availability on lookup failure', async () => {
    mocks.items.mockResolvedValue([
      { id: 'i', movieId: '1', hasStreaming: true },
    ])
    mocks.providers.mockRejectedValue(new Error('Unavailable'))
    await GET(request())
    expect(mocks.itemUpdate).not.toHaveBeenCalled()
    expect(mocks.send).not.toHaveBeenCalled()
  })
  it('retains retry eligibility after a mail failure', async () => {
    mocks.send.mockRejectedValue(new Error('Mail failed'))
    const response = await GET(request())
    expect((await response.json()).failed).toBe(1)
    expect(mocks.itemUpdateMany).not.toHaveBeenCalled()
    expect(mocks.deliveryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'FAILED', lockedUntil: null } })
    )
  })
  it('does not resend when another worker has claimed the digest', async () => {
    mocks.claim.mockResolvedValue({ count: 0 })
    await GET(request())
    expect(mocks.send).not.toHaveBeenCalled()
  })
})
