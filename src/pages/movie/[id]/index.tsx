import Image from 'next/image'
import Layout from "@layout/default";
import { type GetServerSideProps, type NextPage } from "next";
import { getMovieDetails } from '@/utils/getMovieDetails';
import type { MoviePageProps } from '@/types/main';
import Balancer from 'react-wrap-balancer'
import parse from 'html-react-parser';
import movie from '../../../data/movieData.json'
import { signIn, signOut, useSession } from "next-auth/react";



const Movie: NextPage<MoviePageProps> = () => {
  const genres = movie.genres.map(genre => genre.name)
  const { data: sessionData } = useSession();



  return (
    <Layout>
      <div className='container mx-auto px-4 pb-20'>
        <div className='container grid place-content-start lg:grid-cols-6 mb-12'>
          <div className="text-white lg:col-start-1 lg:col-end-4 pb-12">
          <div className='flex flex-col justify-between md:flex-row'>
              <Balancer className='text-3xl xl:text-5xl pb-2 flex'>{movie.name}</Balancer>
              <div className='flex items-center w-8 sm:w-24'>
                <Image src={movie.tomatoRating.iconImage.url} height={50} width={50} alt='Movie Backdrop' />
                <p className='text-lg lg:text-3xl pl-2'>{movie.tomatoRating.tomatometer}%</p>
              </div>
          </div>
          <div className='flex align-middle pt-2 sm:pt-0pb-4'>
              <p className='text-lg xl:text-xl pr-4'>{movie.releaseDate.slice(0, 4)}</p>
              <p className='text-lg xl:text-xl'>Directed By {movie.directedBy}</p>
            </div>
            <div>
            </div>
            <p className='pb-4'>{movie.synopsis}</p>
            <div className='flex flex-col sm:flex-row'>
              <p className='mr-4'>{movie.durationMinutes} minutes</p>
              <div className='flex'>
              {genres.splice(0, 3).map((genre, idx) => <p key={idx} className='first:ml-0 sm:first:ml-2 mx-2'>{genre}</p>)}
              </div>
              <p className='sm:ml-auto mr-2'>{movie.motionPictureRating.code}</p>
            </div>
            <button
        className="text-xl bg-blue-500 hover:bg-blue-700 py-2 px-4 mt-8 bordered font-heading text-white rounded">
       {sessionData ? 'Add to Watchlist' : 'Sign In to Add to Watchlist'} 
      </button>
        </div>
        <div className='lg:col-start-5 lg:col-end-7'>
          <Image src={movie.posterImage.url} height={300} width={450} alt='Movie Backdrop' />
          </div>
        </div>
        <div className='flex w-full'>
          <Balancer className='text-white mx-auto text-xl md:text-3xl xl:text-5xl mb-8'>{parse(movie.tomatoRating.consensus)}</Balancer>
        </div>
        {!!movie.trailer.url &&
        <video width={1000} height={500} controls className='mx-auto'>
          <source src={movie.trailer.url} type='video/mp4' />
        </video>}
      </div>
    </Layout>  
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => { 
  const id = context.query.id as string;

  try {
    const movieDetails = await getMovieDetails(id)
    const { data: { movie } } = movieDetails
    return { props: { movie } }
  } catch (error) {
    return { props: { error } }
  }
  }
  
export default Movie