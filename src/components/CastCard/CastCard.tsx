import type { FC } from 'react'
import type { CastCardProps } from './types'
import Image from 'next/image'

const CastCard: FC<CastCardProps> = ({
  role,
  name,
  characterName,
  headShotImage,
}) => {
  const subtitle = characterName || role

  return (
    <div className="w-28 shrink-0 text-center sm:w-full">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <Image
          src={headShotImage?.url || '/Default-Avatar.png'}
          fill
          sizes="(max-width: 640px) 30vw, 160px"
          className="object-cover"
          alt={`${name} headshot`}
        />
      </div>
      {name && (
        <p className="mt-2 truncate text-sm font-semibold text-white">{name}</p>
      )}
      {subtitle && (
        <p className="truncate text-xs text-zinc-400">{subtitle}</p>
      )}
    </div>
  )
}

export default CastCard
