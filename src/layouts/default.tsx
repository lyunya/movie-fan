import Nav from '@comp/Nav/Nav';
// import Footer from '@comp/HomeFooter';
import Head from '@comp/Head';

import type { FC } from 'react';
import type { DefaultProps as Props } from './types';


const Default: FC<Props> = ({
	children,
}) => (
	<>
		<Head />
		<Nav />
		<main className='bg-gradient-to-b from-[#2e026d] to-[#15162c] min-h-screen flex flex-col min-w-full pt-24'>
			<div className='container mx-auto'>
			{children}
			</div>
		</main>
		{/* <Footer /> */}
	</>
);


export default Default;