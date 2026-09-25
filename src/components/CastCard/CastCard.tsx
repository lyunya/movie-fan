import Image from 'next/image'
import Link from 'next/link'
import type { Credit } from '@/server/catalog/types'
import { PERSON_PLACEHOLDER, filmImage } from '@/utils/film'
import { toSlug } from '@/utils/slug'

/** A person on a film: headshot, name, and the part they played. */
export default function CastCard({ credit }: { credit: Credit }) {
  const { personId, name, character, job, profilePath } = credit
  const subtitle = character || job
  return (
    <Link
      prefetch={false}
      // Link by TMDB id so the right person always resolves
      href={`/person/${toSlug(personId, name)}`}
      title={`See movies with ${name}`}
      className="group w-28 shrink-0 text-center sm:w-full"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition duration-300 group-hover:border-zinc-600">
        <Image
          // Cards render at <=160 CSS px
          src={filmImage(profilePath, 'w185') || PERSON_PLACEHOLDER}
          fill
          sizes="(max-width: 640px) 30vw, 160px"
          className="object-cover transition duration-300 group-hover:scale-105"
          alt={`${name} headshot`}
        />
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-white transition group-hover:text-pink-400">
        {name}
      </p>
      {subtitle && <p className="truncate text-xs text-zinc-400">{subtitle}</p>}
    </Link>
  )
}
