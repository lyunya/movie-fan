import type { FC } from 'react'
import { signIn, signOut, useSession } from "next-auth/react";
import { api } from "../../utils/api";
import Link from 'next/link';
import {useRouter} from 'next/router';


const Nav: FC = () => {
  const router = useRouter()
  const home = router.pathname === '/';

  return (
    <nav className='relative h-18 p-8 bg-black w-full flex items-center justify-between'>
      <Link href='/'>
      <h1 className='text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-pink-400 to-red-600'>Movie Fan</h1>
      </Link>
      {home ? <AuthShowcase /> :
        <Link href='/'>
          <button className='text-md sm:text-xl bg-blue-500 hover:bg-blue-700 py-2 px-4 bordered font-heading text-white rounded'>
            Home
          </button>
        </Link>}
      
    </nav>
  )
}

const AuthShowcase: React.FC = () => {
  const { data: sessionData } = useSession();

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <button
        className="text-md sm:text-xl bg-blue-500 hover:bg-blue-700 py-2 px-4 bordered font-heading text-white rounded"
        onClick={sessionData ? () => signOut() : () => signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
};

export default Nav