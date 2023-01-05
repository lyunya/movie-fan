import type { PropsWithChildren } from 'react';
// make these later
import type { HeroProps } from '@comp/HomeHero';
import type { NavProps } from '@comp/HomeNav';


interface DefaultProps extends PropsWithChildren {
	hero?: HeroProps;
	nav?: NavProps;
	slug?: string;
}