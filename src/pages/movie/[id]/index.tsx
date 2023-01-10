import Image from 'next/image'
import Layout from "@layout/default";
import { type GetServerSideProps, type NextPage } from "next";
import { getMovieDetails } from '@/utils/getMovieDetails';
import type { MoviePageProps } from '@/types/main';

const Movie: NextPage<MoviePageProps> = ({ movie }) => {
  const genres = movie.genres.map(genre => genre.name)


  return (
    <Layout>
      <div className='container mx-auto px-4'>
        <div className='container grid place-content-start lg:grid-cols-6'>
          <div className="text-white lg:col-start-1 lg:col-end-4">
          <div className='flex justify-between'>
              <h1 className='text-3xl xl:text-5xl pb-2 flex'>{movie.name}</h1>
              <div className='flex items-center'>
                <Image src={movie.tomatoRating.iconImage.url} height={50} width={50} alt='Movie Backdrop' />
                <p className='text-lg lg:text-3xl pl-2'>{movie.tomatoRating.tomatometer}%</p>
              </div>
          </div>
          <div className='flex align-middle pb-4'>
              <p className='text-lg xl:text-xl pr-4'>{movie.releaseDate.slice(0, 4)}</p>
              <p className='text-lg xl:text-xl'>Directed By {movie.directedBy}</p>
            </div>
            <div>
            </div>
            <p className='pb-4'>{movie.synopsis}</p>
            <div className='flex'>
              <p className='mr-4'>{movie.durationMinutes} minutes</p>
              {genres.splice(0, 3).map((genre, idx) => <p key={idx} className='mx-2'>{genre}</p>)}
            </div>
        </div>
        <div className='lg:col-start-5 lg:col-end-7'>
          <Image src={movie.posterImage.url} height={300} width={450} alt='Movie Backdrop' />
          </div>
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