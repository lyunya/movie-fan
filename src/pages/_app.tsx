import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { Krona_One, Overpass } from '@next/font/google'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "../utils/api";

import "../styles/globals.css";

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
  const client = new QueryClient();

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={client}>
        <main className={`${kronaOne.variable} ${overPass.variable} font-sans`}>
          <Component {...pageProps} />
        </main>
        </QueryClientProvider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
