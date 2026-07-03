import type { Metadata } from 'next'
import { Krona_One, Overpass } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'

import '@/styles/globals.css'
import Providers from '@/trpc/Providers'
import Nav from '@/components/Nav/Nav'
import Footer from '@/components/Footer/Footer'
import { getSiteUrl } from '@/server/siteUrl'

const kronaOne = Krona_One({
  subsets: ['latin'],
  variable: '--font-kronaOne',
  weight: '400',
})

const overpass = Overpass({
  subsets: ['latin'],
  variable: '--font-overPass',
  display: 'swap',
  weight: ['400', '500', '700', '800'],
})

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Movie Fan',
    template: '%s · Movie Fan',
  },
  description:
    'Discover popular, upcoming, and now-playing movies. Build your watchlist and rate what you have seen.',
  openGraph: {
    title: 'Movie Fan',
    description:
      'Discover popular, upcoming, and now-playing movies. Build your watchlist and rate what you have seen.',
    type: 'website',
    images: ['/movie-ticket.png'],
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${kronaOne.variable} ${overpass.variable}`}
    >
      <body className="font-sans">
        <Providers>
          <div className="flex min-h-screen min-w-full flex-col bg-gradient-to-b from-[#000000] to-[#1e1e1e]">
            <Nav />
            {children}
            <Analytics />
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
