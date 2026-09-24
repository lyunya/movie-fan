import Link from 'next/link'

const links = [
  { href: '/', label: 'Discover' },
  { href: '/tonight', label: 'Movie Night' },
  { href: '/play', label: 'The Frame Game' },
  { href: '/news', label: 'News' },
  { href: '/lists', label: 'Rankings' },
]

/**
 * End credits. TMDB attribution is required by the TMDB API terms of use
 * ("This product uses the TMDB API but is not endorsed or certified by TMDB").
 */
const Footer = () => {
  return (
    <footer className="mt-auto w-full border-t border-ink-line/80 bg-ink-deep/60">
      <div className="shell-x grid gap-8 py-10 text-sm text-zinc-400 md:grid-cols-[1.4fr_1fr_1.2fr]">
        <div>
          <p className="font-display text-xl font-semibold italic text-cream">
            Movie Fan
          </p>
          <p className="mt-2 max-w-xs">
            Your own little film club. Find your next favorite and remember
            every movie night.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="eyebrow mb-3 text-zinc-500">Now showing</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  prefetch={false}
                  href={l.href}
                  className="hover:text-pink-300"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-3">
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center"
            aria-label="The Movie Database (TMDB)"
          >
            {/* TMDB wordmark in their brand gradient (text-only rendition) */}
            <span className="rounded-md bg-gradient-to-r from-[#90cea1] via-[#3cbec9] to-[#00b3e5] bg-clip-text font-heading text-lg font-black tracking-tight text-transparent">
              TMDB
            </span>
          </a>
          <p className="text-xs leading-relaxed text-zinc-500">
            This product uses the TMDB API but is not endorsed or certified by
            TMDB. Streaming availability by JustWatch. News links go to their
            publishers.
          </p>
          <p className="text-xs text-zinc-500">
            Made with <span aria-label="love">❤️</span> by{' '}
            <a
              href="https://leonmarbukh.com/"
              className="text-zinc-300 underline decoration-pink-500 underline-offset-4 transition hover:text-pink-300"
            >
              Leon Marbukh
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
