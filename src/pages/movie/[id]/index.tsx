import { TMDB_BACKDROP_URL } from '@/data/Contstants';
import { useRouter } from 'next/router';
import Image from 'next/image'
import Layout from "@layout/default";

const Movie = () => {
  const router = useRouter();
  const { runtime, overview, backdrop_path, tagline, imdb_id, title }  = router.query;

  return (
    <Layout>
      <div className='container grid place-content-start grid-cols-2 mx-auto px-4'>
      <Image src={`${TMDB_BACKDROP_URL}${backdrop_path}`} height={500} width={1000} alt='Movie Backdrop' />
      <div className="text-white text-center">
          <h1 className='text-5xl pb-6'>{title}</h1>
          <h2 className='text-xl px-4'>{overview}</h2>
      </div>
      </div>
    </Layout>  
  )
}

export default Movie