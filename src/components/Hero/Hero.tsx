import type { FC } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { MovieCardProps } from '@/components/MovieCard/types'

interface HeroProps {
  movie: MovieCardProps
}

const Hero: FC<HeroProps> = ({ movie }) => {
  const poster =
    (typeof movie.posterImage === 'string'
      ? movie.posterImage
      : movie.posterImage?.url) || '/placeholderposter.png'
  const score = movie.tomatoMeter ?? movie.tomatoRating?.tomatometer ?? null

  return (
    <section className="relative overflow-hidden">
      {/* Blurred, darkened poster as an ambient backdrop */}
      <div className="absolute inset-0">
        <Image
          src={poster}
          fill
          priority
          sizes="100vw"
          alt=""
          aria-hidden
          className="scale-110 object-cover blur-2xl brightness-[0.35]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
      </div>

      <div className="relative mx-auto flex max-w-screen-xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:items-end sm:px-8 sm:py-16">
        <div className="relative aspect-[2/3] w-36 shrink-0 overflow-hidden rounded-xl border border-zinc-700 shadow-2xl sm:w-52">
          <Image
            src={poster}
            fill
            priority
            sizes="(max-width: 640px) 40vw, 210px"
            alt={`${movie.name} poster`}
            className="object-cover"
          />
        </div>
        <div className="text-center sm:text-left">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-pink-400">
            #1 Popular
          </p>
          <h2 className="font-heading text-3xl font-bold text-white sm:text-5xl">
            {movie.name}
          </h2>
          {score != null && (
            <p className="chip mt-4 text-base">🍅 {score}%</p>
          )}
          <div className="mt-6">
            <Link href={`/movie/${movie.emsVersionId}`} className="btn-brand">
              View details
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
