'use client'
import Link from 'next/link'
import { signIn, useSession } from 'next-auth/react'
import { api } from '@/utils/api'
import { toSlug } from '@/utils/slug'
import { QueryError } from '@/components/ui/Feedback'
import {
  computePassport,
  stampTilt,
  type PassportMovie,
  type Stamp,
} from '@/utils/passport'

// Stamp inks, cycled per stamp so the page feels collected, not generated.
const INKS = [
  'border-pink-400 text-pink-300',
  'border-gold text-gold',
  'border-teal-300 text-teal-200',
  'border-violet-300 text-violet-200',
  'border-orange-300 text-orange-200',
  'border-sky-300 text-sky-200',
]

// A believable example for visitors who haven't signed in yet.
const SAMPLE: PassportMovie[] = [
  ['Casablanca-style classic', '1942', ['Drama', 'Romance']],
  ['A 70s paranoia thriller', '1974', ['Thriller', 'Mystery']],
  ['An 80s adventure', '1981', ['Adventure', 'Action']],
  ['A 90s crime saga', '1994', ['Crime', 'Drama']],
  ['A hand-drawn fable', '2001', ['Animation', 'Fantasy', 'Family']],
  ['A space odyssey', '2014', ['Science Fiction', 'Drama']],
  ['A folk-horror festival hit', '2019', ['Horror']],
  ['A heist comedy', '2023', ['Comedy', 'Crime']],
].map(([name, year, genres], i) => ({
  movieId: `sample-${i}`,
  name: name as string,
  releaseDate: `${year}-01-01`,
  genres: genres as string[],
  durationMinutes: 115,
  directedBy: i % 3 === 0 ? 'Example Director' : `Director ${i}`,
  userRating: 4,
  watched: true,
  favorite: false,
}))

function StampCard({
  stamp,
  shape,
  ink,
  href,
}: {
  stamp: Stamp
  shape: 'round' | 'visa'
  ink: string
  /** Where to go to earn an unstamped entry */
  href?: string
}) {
  const inner =
    shape === 'round' ? (
      <div
        className={`flex aspect-square w-28 flex-col items-center justify-center rounded-full border-4 border-double text-center sm:w-32 ${stamp.earned ? ink : 'border-dashed border-zinc-700 text-zinc-600'}`}
      >
        <span className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-80">
          Movie Fan
        </span>
        <span className="font-display text-3xl font-bold leading-tight">
          {stamp.label}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
          {stamp.earned
            ? `${stamp.count} film${stamp.count === 1 ? '' : 's'}`
            : 'Not yet'}
        </span>
      </div>
    ) : (
      <div
        className={`flex min-h-24 flex-col justify-between rounded-lg border-2 px-3 py-2.5 ${stamp.earned ? `${ink} border-double` : 'border-dashed border-zinc-700 text-zinc-600'}`}
      >
        <span className="flex items-baseline justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
          <span>Admitted</span>
          {stamp.earned && <span>×{stamp.count}</span>}
        </span>
        <span className="font-display text-lg font-bold uppercase leading-tight tracking-wide">
          {stamp.label}
        </span>
        <span className="line-clamp-1 text-[11px] opacity-80">
          {stamp.earned
            ? `First: ${stamp.firstTitle}`
            : 'Awaiting a first film'}
        </span>
      </div>
    )
  return (
    <li
      className="list-none transition duration-300 hover:rotate-0"
      style={
        stamp.earned
          ? { transform: `rotate(${stampTilt(stamp.key)}deg)` }
          : undefined
      }
    >
      {href ? (
        <Link
          prefetch={false}
          href={href}
          className="block rounded-lg transition hover:opacity-90 [&>div]:hover:border-zinc-500 [&>div]:hover:text-zinc-300"
          aria-label={`${stamp.label}: not stamped yet. Explore ${stamp.label} films`}
        >
          {inner}
        </Link>
      ) : (
        inner
      )}
    </li>
  )
}

export default function PassportClient() {
  const { data: session, status } = useSession()
  const library = api.library.entries.useQuery(undefined, {
    enabled: status === 'authenticated',
  })
  const isSample = status === 'unauthenticated'
  const movies: PassportMovie[] = isSample
    ? SAMPLE
    : (library.data ?? []).map((m) => ({
        movieId: m.filmId,
        name: m.title,
        releaseDate: m.releaseDate,
        genres: m.genres,
        durationMinutes: m.runtime ?? 0,
        directedBy: m.directedBy ?? '',
        userRating: m.rating,
        watched: m.watched,
        favorite: m.favorite,
      }))
  const passport = computePassport(movies)
  const loading =
    status === 'loading' || (status === 'authenticated' && library.isLoading)
  const holder = isSample
    ? 'Example traveler'
    : session?.user?.name || 'Film lover'

  return (
    <main className="page-shell">
      <div className="grid items-start gap-8 lg:grid-cols-[22rem_1fr]">
        {/* The cover */}
        <section
          aria-label="Passport cover"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5b1330] via-[#3d0d22] to-[#240816] p-7 text-center shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] ring-1 ring-inset ring-gold/30 lg:sticky lg:top-24"
        >
          <div className="rounded-xl border border-gold/40 p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-gold/80">
              Movie Fan
            </p>
            <svg
              viewBox="0 0 64 64"
              className="mx-auto my-5 h-20 w-20 text-gold/90"
              aria-hidden
            >
              <circle
                cx="32"
                cy="32"
                r="29"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="32" cy="32" r="6" fill="currentColor" />
              {[0, 72, 144, 216, 288].map((a) => (
                <circle
                  key={a}
                  cx={32 + 16 * Math.cos((a * Math.PI) / 180)}
                  cy={32 + 16 * Math.sin((a * Math.PI) / 180)}
                  r="6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              ))}
            </svg>
            <h1 className="text-3xl font-semibold uppercase tracking-[0.12em] text-gold">
              Film Passport
            </h1>
            <p className="mt-4 text-xs uppercase tracking-[0.25em] text-gold/60">
              Holder
            </p>
            <p className="font-display text-xl italic text-cream">{holder}</p>
            <dl className="mt-6 grid grid-cols-3 gap-2 border-t border-gold/25 pt-5 text-cream">
              {[
                ['Stamps', `${passport.stampCount}/${passport.totalStamps}`],
                ['Films', passport.watchedCount],
                ['Hours', passport.hours],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-gold/60">
                    {label}
                  </dt>
                  <dd className="font-display text-2xl font-semibold tabular-nums">
                    {loading ? '–' : value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          {isSample && (
            <div className="mt-5 space-y-3">
              <p className="text-sm text-pink-100/80">
                This is an example. Sign in and every film you mark watched
                stamps your own passport.
              </p>
              <button className="btn-brand w-full" onClick={() => signIn()}>
                Start your passport
              </button>
            </div>
          )}
        </section>

        {/* The pages */}
        <div className="space-y-12">
          {library.isError ? (
            <QueryError retry={() => library.refetch()} />
          ) : (
            <>
              {!isSample && !loading && passport.watchedCount === 0 && (
                <div className="surface p-6">
                  <p className="font-semibold">
                    Your passport is blank — for now.
                  </p>
                  <p className="mt-1 text-zinc-400">
                    Mark films as watched (or log them in your diary) and stamps
                    appear here.{' '}
                    <Link href="/tonight" className="text-pink-300 underline">
                      Find something for tonight
                    </Link>
                    .
                  </p>
                </div>
              )}
              <section>
                <p className="eyebrow">Eras visited</p>
                <h2 className="section-heading mt-2">Decades</h2>
                <ul
                  className={`mt-6 flex flex-wrap gap-5 ${loading ? 'animate-pulse opacity-40' : ''}`}
                >
                  {passport.decades.map((s, i) => (
                    <StampCard
                      key={s.key}
                      stamp={s}
                      shape="round"
                      ink={INKS[i % INKS.length]!}
                    />
                  ))}
                </ul>
              </section>
              <section>
                <p className="eyebrow">Territories explored</p>
                <h2 className="section-heading mt-2">Genres</h2>
                <ul
                  className={`mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 ${loading ? 'animate-pulse opacity-40' : ''}`}
                >
                  {passport.genres.map((s, i) => (
                    <StampCard
                      key={s.key}
                      stamp={s}
                      shape="visa"
                      ink={INKS[(i + 2) % INKS.length]!}
                      href={
                        s.earned || !s.genreId
                          ? undefined
                          : `/genre/${toSlug(s.genreId, s.label)}`
                      }
                    />
                  ))}
                </ul>
              </section>
              <section>
                <p className="eyebrow">Special visas</p>
                <h2 className="section-heading mt-2">Milestones</h2>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {passport.visas.map((v) => (
                    <li
                      key={v.key}
                      className={`surface flex items-center gap-4 p-4 ${v.earned ? 'ring-1 ring-inset ring-gold/40' : ''}`}
                    >
                      <span
                        aria-hidden
                        className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-double text-lg ${v.earned ? 'border-gold text-gold' : 'border-zinc-700 text-zinc-600'}`}
                      >
                        {v.earned ? '★' : '☆'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                          {v.label}{' '}
                          {v.earned && (
                            <span className="text-xs font-bold uppercase tracking-widest text-gold">
                              · Granted
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-zinc-400">{v.description}</p>
                        <div
                          className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800"
                          role="progressbar"
                          aria-label={`${v.label} progress`}
                          aria-valuemin={0}
                          aria-valuemax={v.goal}
                          aria-valuenow={v.progress}
                        >
                          <div
                            className={`h-full rounded-full ${v.earned ? 'bg-gold' : 'bg-pink-500'}`}
                            style={{ width: `${(v.progress / v.goal) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm tabular-nums text-zinc-400">
                        {v.progress}/{v.goal}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
