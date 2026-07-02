import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { Krona_One, Overpass } from 'next/font/google'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { api } from "../utils/api";

import "@/styles/globals.css"

const kronaOne = Krona_One({
  subsets: ['latin'],
  variable: '--font-kronaOne',
  weight: "400"
})

const overPass = Overpass({
  subsets: ['latin'],
  variable: '--font-overPass',
  display: "swap",
  weight: ["400", "500", "700", "800"]
})

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  // withTRPC (see the export below) provides the QueryClient for the whole
  // app; creating a second one here would split the cache in two
  return (
    <SessionProvider session={session}>
      <main className={`${kronaOne.variable} ${overPass.variable} font-sans`}>
        <Component {...pageProps} />
      </main>
      <ReactQueryDevtools initialIsOpen={false} />
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
