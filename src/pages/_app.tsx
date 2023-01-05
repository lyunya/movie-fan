import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { Krona_One, Rubik_Bubbles } from '@next/font/google'
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
  return (
    <SessionProvider session={session}>
      <main className={`${kronaOne.variable} ${Rubik.variable} font-sans`}>
        <Component {...pageProps} />
      </main>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
