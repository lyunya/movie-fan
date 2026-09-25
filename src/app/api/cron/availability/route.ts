import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createHash } from 'node:crypto'
import { env } from '@/env/server.mjs'
import { prisma } from '@/server/db'
import { availability } from '@/server/availability'
import { getSiteUrl } from '@/server/siteUrl'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!
  )
export async function GET(req: Request) {
  if (
    !env.CRON_SECRET ||
    req.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`
  )
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const users = await prisma.user.findMany({
    where: { streamAlerts: true, email: { not: null } },
    select: {
      id: true,
      email: true,
      name: true,
      watchRegion: true,
      preferredProviders: true,
    },
  })
  const transporter = nodemailer.createTransport({
    host: env.EMAIL_SERVER_HOST,
    port: Number(env.EMAIL_SERVER_PORT),
    auth: { user: env.EMAIL_SERVER_USER, pass: env.EMAIL_SERVER_PASSWORD },
  })
  let notified = 0,
    failed = 0
  for (const user of users) {
    const items = await prisma.watchListItem.findMany({
      where: { userId: user.id, inWatchlist: true },
    })
    // A failed lookup must never erase known availability, so only films
    // checked successfully change state.
    const result = await availability.streamingFor(
      items.map((item) => item.movieId),
      { region: user.watchRegion, services: user.preferredProviders }
    )
    const streaming = new Set(result.available.map((a) => a.filmId))
    const unchecked = new Set(result.failed)
    const stopped = items.filter(
      (item) =>
        item.hasStreaming &&
        !streaming.has(item.movieId) &&
        !unchecked.has(item.movieId)
    )
    if (stopped.length)
      await prisma.watchListItem.updateMany({
        where: { id: { in: stopped.map((item) => item.id) } },
        data: { hasStreaming: false },
      })
    const available = items.filter(
      (item) => !item.hasStreaming && streaming.has(item.movieId)
    )
    if (!available.length || !user.email) continue
    const digest = createHash('sha256')
      .update(
        `${user.id}:${available
          .map((m) => m.movieId)
          .sort()
          .join(',')}:${new Date().toISOString().slice(0, 10)}`
      )
      .digest('hex')
    await prisma.streamingDelivery.createMany({
      data: [{ id: digest, userId: user.id }],
      skipDuplicates: true,
    })
    const claim = await prisma.streamingDelivery.updateMany({
      where: {
        id: digest,
        OR: [
          { status: { in: ['NEW', 'FAILED'] } },
          { status: 'PROCESSING', lockedUntil: { lt: new Date() } },
        ],
      },
      data: {
        status: 'PROCESSING',
        lockedUntil: new Date(Date.now() + 300000),
      },
    })
    if (!claim.count) continue
    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: user.email,
        messageId: `<${digest}@movie-fan>`,
        subject: `${available.length} watchlist ${available.length === 1 ? 'film is' : 'films are'} available to stream`,
        html: `<p>Something for your next movie night (${escape(user.watchRegion)}):</p><ul>${available.map((m) => `<li><a href="${getSiteUrl()}/movie/${encodeURIComponent(m.movieId)}">${escape(m.name)}</a></li>`).join('')}</ul><p><a href="${getSiteUrl()}/profile">Manage services or turn off alerts</a></p>`,
      })
      // Commit notification state only after successful delivery. A failed send retries next run.
      await prisma.$transaction([
        prisma.watchListItem.updateMany({
          where: { id: { in: available.map((m) => m.id) } },
          data: { hasStreaming: true },
        }),
        prisma.streamingDelivery.update({
          where: { id: digest },
          data: { status: 'SENT', sentAt: new Date(), lockedUntil: null },
        }),
      ])
      notified++
    } catch {
      await prisma.streamingDelivery.update({
        where: { id: digest },
        data: { status: 'FAILED', lockedUntil: null },
      })
      failed++
    }
  }
  return NextResponse.json({
    ok: failed === 0,
    usersChecked: users.length,
    notified,
    failed,
  })
}
