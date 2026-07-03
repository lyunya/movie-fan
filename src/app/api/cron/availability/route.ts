import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

import { env } from '@/env/server.mjs'
import { prisma } from '@/server/db'
import { fetchMovieDetails } from '@/server/tmdb'
import { getSiteUrl } from '@/server/siteUrl'

// A daily job, invoked by Vercel Cron (see vercel.json). Never cache it.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * For every user opted into streaming alerts, check their un-rated watchlist
 * items' streaming availability, email them about titles that newly appeared
 * on a flatrate service, and persist the new availability so each title is
 * only announced once.
 */
export async function GET(req: Request) {
  const secret = env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    where: { streamAlerts: true, email: { not: null } },
    select: { id: true, email: true, name: true },
  })

  const transporter = nodemailer.createTransport({
    host: env.EMAIL_SERVER_HOST,
    port: Number(env.EMAIL_SERVER_PORT),
    auth: {
      user: env.EMAIL_SERVER_USER,
      pass: env.EMAIL_SERVER_PASSWORD,
    },
  })

  const base = getSiteUrl()
  let notified = 0

  for (const user of users) {
    const items = await prisma.watchListItem.findMany({
      where: { userId: user.id, userRating: null },
    })

    const newlyAvailable: { name: string; movieId: string }[] = []

    for (const item of items) {
      const details = await fetchMovieDetails(item.movieId).catch(() => null)
      const streaming = !!details?.watchProviders?.flatrate?.length
      if (streaming && !item.hasStreaming) {
        newlyAvailable.push({ name: item.name, movieId: item.movieId })
      }
      // Persist any transition so a title is announced exactly once
      if (streaming !== item.hasStreaming) {
        await prisma.watchListItem.update({
          where: { id: item.id },
          data: { hasStreaming: streaming },
        })
      }
    }

    if (newlyAvailable.length > 0 && user.email) {
      const list = newlyAvailable
        .map(
          (movie) =>
            `<li><a href="${base}/movie/${movie.movieId}">${movie.name}</a></li>`
        )
        .join('')
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: user.email,
        subject:
          newlyAvailable.length > 1
            ? `${newlyAvailable.length} watchlist movies are now streaming`
            : `A watchlist movie is now streaming`,
        html: `<p>Good news${
          user.name ? `, ${user.name}` : ''
        }! These are now available to stream:</p><ul>${list}</ul><p><a href="${base}/profile">Manage your watchlist</a></p>`,
      })
      notified++
    }
  }

  return NextResponse.json({ ok: true, usersChecked: users.length, notified })
}
