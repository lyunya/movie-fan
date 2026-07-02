import NextHead from 'next/head'
import type { FC } from 'react'

interface HeadProps {
  title?: string
  description?: string
  image?: string
}

const Head: FC<HeadProps> = ({
  title = 'Movie Fan',
  description = 'Discover popular, upcoming, and now-playing movies. Build your watchlist and rate what you have seen.',
  image = '/movie-ticket.png',
}) => {
  const fullTitle = title === 'Movie Fan' ? title : `${title} · Movie Fan`

  return (
    <NextHead>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="theme-color" content="#000000" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <link rel="icon" href="/favicon.ico" />
    </NextHead>
  )
}

export default Head
