import type { FC } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'

const Nav: FC = () => {
  const router = useRouter()
  const onProfilePage = router.pathname === '/profile'
  const { data: sessionData } = useSession()

  return (
    <nav className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-zinc-800/80 bg-black/70 px-4 py-4 backdrop-blur-md sm:px-8">
      <Link href="/">
        <h1 className="gradient-text font-heading text-3xl font-extrabold sm:text-4xl lg:text-5xl">
          Movie Fan
        </h1>
      </Link>
      <div className="flex items-center gap-4">
        {sessionData ? (
          <>
            {onProfilePage ? (
              <button className="btn-ghost" onClick={() => signOut({ callbackUrl: '/' })}>
                Sign Out
              </button>
            ) : (
              <Link
                href="/profile"
                className="rounded-full ring-2 ring-transparent transition hover:ring-pink-500"
                aria-label="Go to your profile"
              >
                <Image
                  src={sessionData.user?.image || '/avatar.png'}
                  width={48}
                  height={48}
                  alt="Your profile avatar"
                  className="h-12 w-12 rounded-full object-cover"
                />
              </Link>
            )}
          </>
        ) : (
          <button className="btn-brand" onClick={() => signIn()}>
            Sign in
          </button>
        )}
      </div>
    </nav>
  )
}

export default Nav
