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
		<main>
			{children}
		</main>
		{/* <Footer /> */}
	</>
);


export default Default;