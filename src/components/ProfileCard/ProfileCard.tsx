import type { FC } from "react"
import type { ProfileCardProps } from "./types"
import Image from "next/image"

const ProfileCard:FC<ProfileCardProps> = ({ user, rated, watchList }) => {
  return (
    <div className="mx-auto my-8 flex justify-center gap-8">
      <Image
        className="h-24 w-24 rounded-full sm:h-48 sm:w-48"
        src={user?.image || '/avatar.png'}
        width={150}
        height={150}
        alt={'Profile avatar'}
      />
      <div className="flex flex-col justify-center gap-y-2">
        <h1 className="mb-2 text-2xl font-bold text-white underline	underline-offset-8">
          {user?.name} Profile
        </h1>
        <div className="flex items-center gap-x-4">
          <Image
            src={'/popcorn.png'}
            width={35}
            height={35}
            alt={'Movie Ticket icon'}
          />
          <p className="text-white">{rated?.length} movies rated</p>
        </div>
        <div className="flex items-center gap-x-4">
          <Image
            src={'/movie-ticket.png'}
            width={35}
            height={35}
            alt={'Movie Ticket icon'}
          />
          <p className="text-white">{watchList?.length} movies in watchlist</p>
        </div>
      </div>
    </div>
  )
}

export default ProfileCard