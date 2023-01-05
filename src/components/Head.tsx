import NextHead from "next/head"
import type { FC } from "react"


const Head: FC = () => (
  <NextHead>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Movie Fan</title>
    <meta name="description" content="Movie Fan App" />
    <link rel="icon" href="/favicon.ico" />
  </NextHead>
)

export default Head