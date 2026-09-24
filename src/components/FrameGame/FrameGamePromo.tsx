import Image from 'next/image'
import Link from 'next/link'

/** Home teaser for the Frame Game: three out-of-focus stills and a dare. */
export default function FrameGamePromo({ stills }: { stills: string[] }) {
  return (
    <section className="surface relative flex flex-col justify-between gap-6 overflow-hidden p-5 sm:p-7">
      <div>
        <p className="eyebrow text-gold">New · Daily game</p>
        <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight">
          Name the film from a single frame.
        </h2>
        <p className="mt-2 max-w-md text-zinc-400">
          Ten out-of-focus stills. Guess early for more points, or pull focus if
          you need a closer look.
        </p>
      </div>
      {stills.length > 0 && (
        <div className="flex gap-2 rounded-xl bg-black/60 p-2" aria-hidden>
          {stills.map((src, i) => (
            <div
              key={src}
              className="relative aspect-video flex-1 overflow-hidden rounded-md"
            >
              <Image
                src={src}
                fill
                sizes="160px"
                alt=""
                className="scale-110 object-cover"
                style={{ filter: `blur(${14 - i * 5}px)` }}
              />
              <span className="absolute inset-0 grid place-items-center font-display text-3xl font-bold text-white/80">
                ?
              </span>
            </div>
          ))}
        </div>
      )}
      <Link href="/play" className="btn-brand self-start">
        Play today’s reel
      </Link>
    </section>
  )
}
