import type { FC } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'

const Nav: FC = () => {
  const router = useRouter()
  const profilePage = router.pathname === '/profile'
  const { data: sessionData } = useSession()

  return (
    <nav className="h-18 relative flex w-full items-center justify-between bg-black p-8">
      <Link href="/">
        <h1 className="bg-gradient-to-br from-pink-400 to-red-600 bg-clip-text font-heading text-4xl font-extrabold text-transparent sm:text-5xl lg:text-6xl">
          Movie Fan
        </h1>
      </Link>
      <div className="flex gap-8">
        {sessionData && profilePage ? (
          <button
            className="text-md bordered rounded bg-blue-500 py-2 px-4 font-heading text-white hover:bg-blue-700 sm:text-xl"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Sign Out
          </button>
        ) : sessionData ? (
          <Link href="/profile">
            <Image
              src={sessionData?.user?.image || '/avatar.png'}
              width={70}
              height={70}
              alt="profile avatar"
              className="h-18 w-18 rounded-full"
            />
          </Link>
        ) : null}
        {!sessionData && <AuthShowcase />}
      </div>
    </nav>
  )
}

const AuthShowcase: React.FC = () => {
  const { data: sessionData } = useSession()

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <button
        className="text-md bordered rounded bg-blue-500 py-2 px-4 font-heading text-white hover:bg-blue-700 sm:text-xl"
        onClick={sessionData ? () => signOut() : () => signIn()}
      >
        {sessionData ? 'Sign out' : 'Sign in'}
      </button>
    </div>
  )
}

export default Nav
