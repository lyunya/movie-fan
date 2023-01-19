import type { FC } from "react"
import CastCard from "../CastCard/CastCard"
import type { CastGridProps } from "./types"

const CastGrid:FC<CastGridProps> = ({ cast }) => {
  return (
    <div className="my-12 text-white lg:col-start-1 lg:col-end-5">
      <>
        <h3 className="mb-4 text-xl">Cast</h3>
        <div className="grid-credit-cards mx-auto grid auto-rows-fr gap-y-4 2xl:grid-cols-4	">
          {cast.map((castMember) => {
            return <CastCard key={castMember.id} {...castMember} />
          })}
        </div>
      </>
    </div>
  )
}

export default CastGrid