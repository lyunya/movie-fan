import Image from 'next/image'
import Layout from "@layout/default";
import { type GetServerSideProps, type NextPage } from "next";
import { getMovieDetails } from '@/utils/getMovieDetails';

const Movie: NextPage = ({ data }) => {
  console.log(data.movieDetails)


  return (
    <Layout>
      {/* <div className='container grid place-content-start grid-cols-2 mx-auto px-4'>
      <Image src={`${TMDB_BACKDROP_URL}${backdrop_path}`} height={500} width={1000} alt='Movie Backdrop' />
      <div className="text-white text-center">
          <h1 className='text-5xl pb-6'>{title}</h1>
          <h2 className='text-xl px-4'>{overview}</h2>
      </div>
      </div> */}
      <h1>leon</h1>
    </Layout>  
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => { 
  const id = context.query.id as string;

  try {
    const movieDetails = await getMovieDetails(id)
    return { props: { data: {  movieDetails } } }
  } catch (error) {
    return { props: { error } }
  }
  }
  
export default Movie