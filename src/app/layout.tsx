import type { Metadata } from 'next'
import { Overpass } from 'next/font/google'

import '@/styles/globals.css'
import Providers from '@/trpc/Providers'
import Nav from '@/components/Nav/Nav'
import ResumeSave from '@/components/ui/ResumeSave'
import Feedback from '@/components/ui/Feedback'
import Footer from '@/components/Footer/Footer'
import { getSiteUrl } from '@/server/siteUrl'

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
    'Find your next favorite. Remember every movie night. Build a library, rank your favorites, and choose what to watch with friends.',
  openGraph: {
    title: 'Movie Fan',
    description:
      'Your own little film club: discover movies, rank your favorites, and remember every movie night.',
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
    <html lang="en" className={overpass.variable}>
      <body className="font-heading">
        <Providers>
          <div className="flex min-h-screen min-w-full flex-col bg-[#111013] pb-20 lg:pb-0">
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
