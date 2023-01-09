import type { FC } from 'react'
import { signIn, signOut, useSession } from "next-auth/react";
import { api } from "../../utils/api";
import Link from 'next/link';

const Nav: FC = () => {
  return (
    <nav className='relative h-18 p-8 bg-black w-full flex items-center justify-between'>
      <Link href='/'>
      <h1 className='text-5xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-pink-400 to-red-600'>Movie Fan</h1>
      </Link>
      <AuthShowcase />
    </nav>
  )
}

const AuthShowcase: React.FC = () => {
  const { data: sessionData } = useSession();

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <button
        className="text-xl bg-blue-500 hover:bg-blue-700 py-2 px-4 bordered font-heading text-white rounded"
        onClick={sessionData ? () => signOut() : () => signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
};

export default Nav