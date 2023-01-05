import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { Krona_One, Rubik_Bubbles } from '@next/font/google'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "../utils/api";

import "../styles/globals.css";

const kronaOne = Krona_One({
  subsets: ['latin'],
  variable: '--font-kronaOne',
  weight: "400"
})

const Rubik = Rubik_Bubbles({
  subsets: ['latin'],
  variable: '--font-rubik',
  weight: "400"
})

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const client = new QueryClient();

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={client}>
        <main className={`${kronaOne.variable} ${Rubik.variable} font-sans`}>
          <Component {...pageProps} />
        </main>
        </QueryClientProvider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
