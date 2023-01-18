/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck 
import Layout from '@layout/default'
import { api } from '@/utils/api'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import MovieGrid from '@/components/SearchResults/SearchResults'
import MovieCard from '@/components/MovieCard/MovieCard'
import { useAutoAnimate } from '@formkit/auto-animate/react'

const Profile = () => {
  const [animationParent] = useAutoAnimate()

  const [selected, setSelected] = useState('watchlist')
  const { data: sessionData } = useSession()
  const profileData = api.user.query.useQuery()
  const ratedMovies = profileData.data?.movies.filter(
    (movie) => movie.userRating
  )
  const watchList = profileData.data?.movies.filter(
    (movie) => !movie.userRating
  )

  const ratedMovieCards =
    ratedMovies?.map((movie, idx) => {
      return <MovieCard key={idx} {...movie} />
    }) || null

  const watchListMovieCards =
    watchList?.map((movie, idx) => {
      return <MovieCard key={idx} {...movie} />
    }) || null

  if (!sessionData) {
    return (
      <Layout>
        <h1 className="text-center text-3xl text-white xl:text-5xl">
          Please sign in to view your profile
        </h1>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto" ref={animationParent}>
        <h1 className="text-center text-3xl text-white xl:text-5xl mb-8">
          {profileData.data?.user?.name} Profile
        </h1>
        <div className="mb-20 flex items-center justify-center text-white">
          <button
            className={`text-md bordered py-2 px-4 font-heading text-white sm:text-xl ${
              selected === 'watchlist' && 'rounded bg-gray-800'
            }`}
            onClick={() => setSelected('watchlist')}
          >
            WatchList
          </button>
          <button
            className={`text-md bordered py-2 px-4 font-heading text-white sm:text-xl ${
              selected === 'seen' && 'rounded bg-gray-800'
            }`}
            onClick={() => setSelected('seen')}
          >
            Seen
          </button>
        </div>
        {selected === 'watchlist' && watchListMovieCards?.length && (
          <MovieGrid movieCards={watchListMovieCards} />
        )}
        {selected === 'seen' && ratedMovieCards?.length && (
          <MovieGrid movieCards={ratedMovieCards} />
        )}
      </div>
    </Layout>
  )
}

export default Profile
