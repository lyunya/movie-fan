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
  { href: '/play', label: 'Frame Game' },
]

function TicketMark() {
  return (
    <svg
      viewBox="0 0 32 24"
      className="h-6 w-8 -rotate-6 text-pink-400 transition group-hover:rotate-0"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M3 2h26a1 1 0 0 1 1 1v5a4 4 0 0 0 0 8v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-5a4 4 0 0 0 0-8V3a1 1 0 0 1 1-1Z"
      />
      <path
        stroke="#111013"
        strokeWidth="1.5"
        strokeDasharray="2 2"
        d="M22 4v16"
      />
      <path
        fill="#111013"
        d="m12 7.5 1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.5-2.5 1.5.6-2.8-2.1-1.9 2.8-.3z"
      />
    </svg>
  )
}
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
      <header className="sticky top-0 z-50 border-b border-ink-line/80 bg-ink/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2"
            aria-label="Movie Fan home"
          >
            <TicketMark />
            <span className="font-display text-2xl font-semibold italic tracking-tight text-cream sm:text-[1.7rem]">
              Movie Fan
            </span>
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
        <nav aria-label="Account" className="grid gap-1 sm:grid-cols-2">
          {[
            { href: '/library', label: 'Your library' },
            { href: '/lists', label: 'Lists & rankings' },
            { href: '/diary', label: 'Movie diary' },
            { href: '/passport', label: 'Film passport' },
            { href: '/play', label: 'The Frame Game' },
            { href: '/news', label: 'News' },
            { href: '/circle', label: 'Your circle' },
            { href: '/profile', label: 'Profile & settings' },
          ].map((d) => (
            <Link
              className="rounded-lg px-3 py-2.5 hover:bg-zinc-800"
              onClick={() => setOpen(false)}
              key={d.href}
              href={d.href}
            >
              {d.label}
            </Link>
          ))}
          <button
            className="btn-ghost mt-3 sm:col-span-2"
            onClick={() => signOut()}
          >
            Sign out
          </button>
        </nav>
      </Dialog>
      {
        <nav
          aria-label="Mobile navigation"
          className={`safe-area-bottom fixed inset-x-0 bottom-0 z-40 ${pathname.startsWith('/movie/') ? 'hidden sm:grid' : 'grid'} grid-cols-4 border-t border-ink-line bg-ink/95 px-2 pt-2 backdrop-blur lg:hidden`}
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
