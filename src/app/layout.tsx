import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'

import '@/styles/globals.css'
import Providers from '@/trpc/Providers'
import Nav from '@/components/Nav/Nav'
import ResumeSave from '@/components/ui/ResumeSave'
import Feedback from '@/components/ui/Feedback'
import Footer from '@/components/Footer/Footer'
import { getSiteUrl } from '@/server/siteUrl'

// Self-hosted variable fonts (from npm, so builds never depend on reaching
// Google Fonts). Overpass carries the UI; Fraunces is the editorial display
// face for page titles and section headings.
const overpass = localFont({
  src: '../../node_modules/@fontsource-variable/overpass/files/overpass-latin-wght-normal.woff2',
  variable: '--font-overPass',
  display: 'swap',
  weight: '100 900',
})
const fraunces = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-italic.woff2',
      style: 'italic',
    },
  ],
  variable: '--font-display',
  display: 'swap',
  weight: '100 900',
})

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Movie Fan',
    template: '%s · Movie Fan',
  },
  description:
    'Find your next favorite. Remember every movie night. Build a library, rank your favorites, and choose what to watch with friends.',
  openGraph: {
    title: 'Movie Fan',
    description:
      'Your own little film club: discover movies, rank your favorites, and remember every movie night.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  themeColor: '#111013',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${overpass.variable} ${fraunces.variable}`}>
      <body className="font-heading">
        <Providers>
          <div className="flex min-h-screen min-w-full flex-col bg-ink pb-20 lg:pb-0">
            <Nav />
            <div id="main-content" tabIndex={-1} className="flex-1">
              {children}
            </div>
            <Feedback />
            <ResumeSave />
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
