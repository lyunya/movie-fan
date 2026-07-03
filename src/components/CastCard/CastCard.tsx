import type { FC } from 'react'
import type { CastCardProps } from './types'
import Image from 'next/image'
import Link from 'next/link'
import { toSlug } from '@/utils/slug'

const CastCard: FC<CastCardProps> = ({
  id,
  role,
  name,
  characterName,
  headShotImage,
}) => {
  const subtitle = characterName || role

  const card = (
    <>
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition duration-300 group-hover:border-zinc-600">
        <Image
          src={headShotImage?.url || '/Default-Avatar.png'}
          fill
          sizes="(max-width: 640px) 30vw, 160px"
          className="object-cover transition duration-300 group-hover:scale-105"
          alt={`${name} headshot`}
        />
      </div>
      {name && (
        <p className="mt-2 truncate text-sm font-semibold text-white transition group-hover:text-pink-400">
          {name}
        </p>
      )}
      {subtitle && <p className="truncate text-xs text-zinc-400">{subtitle}</p>}
    </>
  )

  // Clicking a person opens their in-app profile with a filmography.
  // Link by TMDB id when we have one so the right person always resolves.
  if (name) {
    const href = id ? `/person/${toSlug(id, name)}` : `/person/${encodeURIComponent(name)}`
    return (
      <Link
        href={href}
        title={`See movies with ${name}`}
        className="group w-28 shrink-0 text-center sm:w-full"
      >
        {card}
      </Link>
    )
  }

  return <div className="group w-28 shrink-0 text-center sm:w-full">{card}</div>
}

export default CastCard
