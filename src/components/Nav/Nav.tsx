import type { FC } from 'react'
import { signIn, signOut, useSession } from "next-auth/react";
import { api } from "../../utils/api";

const Nav: FC = () => {
  return (
    <nav className='relative h-18 p-8 text-white bg-cyan-400 w-full flex items-center justify-between'>
      <h1 className='text-5xl font-heading'>Movie Fan</h1>
      <AuthShowcase />
    </nav>
  )
}

const AuthShowcase: React.FC = () => {
  const { data: sessionData } = useSession();

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <button
        className="text-xl bg-purple-500 hover:bg-purple-700 p-4 border-8 border-black font-heading"
        onClick={sessionData ? () => signOut() : () => signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
};

export default Nav