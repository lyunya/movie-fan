import type { FC } from 'react'
import type { ProfileCardProps } from './types'
import Image from 'next/image'

const ProfileCard: FC<ProfileCardProps> = ({ user, rated, watchList }) => {
  return (
    <div className="surface mx-auto my-8 flex max-w-2xl flex-col items-center gap-6 p-6 sm:flex-row sm:gap-8">
      <Image
        className="h-24 w-24 rounded-full object-cover ring-2 ring-pink-500/50 sm:h-32 sm:w-32"
        src={user?.image || '/avatar.png'}
        width={128}
        height={128}
        alt="Profile avatar"
      />
      <div className="flex flex-col items-center gap-3 sm:items-start">
        <h1 className="text-2xl font-bold text-white">
          {user?.name || 'Movie Fan'}
        </h1>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-full bg-zinc-800/80 px-4 py-2">
            <Image src="/popcorn.png" width={22} height={22} alt="" />
            <span className="text-white">
              <span className="font-bold">{rated?.length ?? 0}</span> rated
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-zinc-800/80 px-4 py-2">
            <Image src="/movie-ticket.png" width={22} height={22} alt="" />
            <span className="text-white">
              <span className="font-bold">{watchList?.length ?? 0}</span> to watch
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileCard
