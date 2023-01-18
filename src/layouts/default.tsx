import Nav from '@comp/Nav/Nav';
import Footer from '@comp/Footer/Footer';
import Head from '@comp/Head';

import type { FC } from 'react';
import type { DefaultProps as Props } from './types';


const Default: FC<Props> = ({ children }) => (
  <>
    <Head />
    <main className="flex min-h-screen min-w-full flex-col bg-gradient-to-b from-[#000000] to-[#1e1e1e]">
      <Nav />
      {children}
      <Footer />
    </main>
  </>
)


export default Default;