'use client'
import { useState } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HiOutlineCollection,
  HiOutlineHome,
  HiOutlineSearch,
  HiOutlineTicket,
} from 'react-icons/hi'
import NavSearch from './NavSearch'
import Dialog from '@/components/ui/Dialog'
const destinations = [
  { href: '/', label: 'Discover' },
  { href: '/library', label: 'Library' },
  { href: '/news', label: 'News' },
  { href: '/tonight', label: 'Movie Night' },
]
export default function Nav() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const active = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-[#111013]/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <Link
            href="/"
            className="shrink-0 font-heading text-2xl font-extrabold tracking-tight text-pink-400 sm:text-3xl"
          >
            Movie Fan<span className="ml-1 text-pink-300">.</span>
          </Link>
          <nav aria-label="Main navigation" className="hidden gap-6 lg:flex">
            {destinations.map((d) => (
              <Link
                key={d.href}
                href={d.href}
                aria-current={active(d.href) ? 'page' : undefined}
                className={active(d.href) ? 'nav-link-active' : 'nav-link'}
              >
                {d.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <NavSearch />
            {session ? (
              <button
                className="icon-button border border-zinc-700 text-pink-300"
                aria-label="Open account menu"
                onClick={() => setOpen(true)}
              >
                {session.user?.name?.slice(0, 1) || 'M'}
              </button>
            ) : (
              <button
                className="btn-brand !px-4 !py-2.5 !text-sm"
                onClick={() => signIn()}
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={session?.user?.name || 'Your account'}
      >
        <nav aria-label="Account" className="flex flex-col gap-2">
          {[
            { href: '/library', label: 'Your library' },
            { href: '/lists', label: 'Lists & rankings' },
            { href: '/diary', label: 'Movie diary' },
            { href: '/news', label: 'News' },
            { href: '/circle', label: 'Your circle' },
            { href: '/profile', label: 'Profile & settings' },
          ].map((d) => (
            <Link
              className="rounded-lg p-3 hover:bg-zinc-800"
              onClick={() => setOpen(false)}
              key={d.href}
              href={d.href}
            >
              {d.label}
            </Link>
          ))}
          <button className="btn-ghost mt-4" onClick={() => signOut()}>
            Sign out
          </button>
        </nav>
      </Dialog>
      {
        <nav
          aria-label="Mobile navigation"
          className={`safe-area-bottom fixed inset-x-0 bottom-0 z-40 ${pathname.startsWith('/movie/') ? 'hidden sm:grid' : 'grid'} grid-cols-4 border-t border-zinc-800 bg-[#111013]/95 px-2 pt-2 backdrop-blur lg:hidden`}
        >
          {[
            { href: '/', label: 'Discover', icon: HiOutlineHome },
            { href: '/library', label: 'Library', icon: HiOutlineCollection },
            { href: '#search', label: 'Search', icon: HiOutlineSearch },
            { href: '/tonight', label: 'Movie Night', icon: HiOutlineTicket },
          ].map((d) =>
            d.href === '#search' ? (
              <button
                key={d.href}
                className="mobile-nav"
                onClick={() =>
                  window.dispatchEvent(new Event('movie-fan-search'))
                }
              >
                <d.icon />
                <span>{d.label}</span>
              </button>
            ) : (
              <Link
                key={d.href}
                href={d.href}
                aria-current={active(d.href) ? 'page' : undefined}
                className={`mobile-nav ${active(d.href) ? 'text-pink-300' : ''}`}
              >
                <d.icon />
                <span>{d.label}</span>
              </Link>
            )
          )}
        </nav>
      }
    </>
  )
}
