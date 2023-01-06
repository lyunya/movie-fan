import { TMDB_BACKDROP_URL } from '@/data/Contstants';
import { useRouter } from 'next/router';
import Image from 'next/image'
import Layout from "@layout/default";

const Movie = () => {
  const router = useRouter();
  const { runtime, overview, backdrop_path, tagline, imdb_id }  = router.query;

  return (
    <Layout>
      <Image src={`${TMDB_BACKDROP_URL}${backdrop_path}`} height={1000} width={1000} alt='Movie Backdrop' />
    </Layout>  
  )
}

export default Movie