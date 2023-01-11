import Nav from '@comp/Nav/Nav';
import Footer from '@comp/Footer/Footer';
import Head from '@comp/Head';

import type { FC } from 'react';
import type { DefaultProps as Props } from './types';


const Default: FC<Props> = ({
	children,
}) => (
	<>
		<Head />
		<Nav />
		<main className='bg-gradient-to-b from-[#000000] to-[#1e1e1e] min-h-screen flex flex-col min-w-full'>
			{children}
		</main>
		<Footer />
	</>
);


export default Default;