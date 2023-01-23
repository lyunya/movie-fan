import type { FC } from "react"
import type { CastCardProps } from "./types"
import Image from "next/image"
import Balancer from "react-wrap-balancer"

const CastCard: FC<CastCardProps> = ({
  id,
  role,
  name,
  characterName,
  headShotImage,
}) => {
  return (
    <div className="min-w-44 flex max-w-fit flex-col text-white">
      <div className='min-h-fit'>
        <Image
          src={headShotImage?.url || '/Default-Avatar.png'}
          className="z-20 mx-auto mb-2 aspect-auto h-60 rounded object-cover"
          height={240}
          width={176}
          alt={`${name} headshot`}
        />
      </div>
      <div className="flex h-full flex-col gap-y-1 text-center">
        {name && <p className="text-lg font-bold">{name}</p>}
        {characterName && <p>{characterName}</p>}
      </div>
    </div>
  )
}

export default CastCard