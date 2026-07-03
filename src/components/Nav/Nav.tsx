'use client'

import type { FC } from 'react'
import { useEffect, useRef, useState } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { HiOutlineUser, HiOutlineLogout } from 'react-icons/hi'
import NavSearch from './NavSearch'

const Nav: FC = () => {
  const { data: sessionData } = useSession()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close the menu on outside click or Escape
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <nav className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-zinc-800/80 bg-black/70 px-4 py-4 backdrop-blur-md sm:px-8">
      <Link href="/">
        <h1 className="gradient-text font-heading text-3xl font-extrabold sm:text-4xl lg:text-5xl">
          Movie Fan
        </h1>
      </Link>
      <div className="flex items-center gap-2 sm:gap-4">
        <NavSearch />
        {sessionData ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((current) => !current)}
              className="block rounded-full ring-2 ring-transparent transition hover:ring-pink-500"
              aria-label="Open account menu"
              aria-expanded={open}
              aria-haspopup="menu"
            >
              <Image
                src={sessionData.user?.image || '/avatar.png'}
                width={48}
                height={48}
                alt="Your profile avatar"
                className="h-12 w-12 rounded-full object-cover"
              />
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/95 shadow-2xl backdrop-blur"
              >
                <div className="border-b border-zinc-800 px-4 py-3">
                  <p className="truncate font-semibold text-white">
                    {sessionData.user?.name || 'Movie Fan'}
                  </p>
                  {sessionData.user?.email && (
                    <p className="truncate text-xs text-zinc-500">
                      {sessionData.user.email}
                    </p>
                  )}
                </div>
                <Link
                  href="/profile"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-zinc-200 transition hover:bg-zinc-800/80 hover:text-pink-400"
                >
                  <HiOutlineUser className="h-5 w-5" />
                  Profile &amp; watchlist
                </Link>
                <button
                  role="menuitem"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-zinc-200 transition hover:bg-zinc-800/80 hover:text-pink-400"
                >
                  <HiOutlineLogout className="h-5 w-5" />
                  Sign out
                </button>
              </div>
            )}
          </div>
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
