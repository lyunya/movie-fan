import Layout from '@layout/default'
import { type GetServerSideProps, type NextPage } from 'next'
import type { MoviePageProps } from '@/types/main'
import { useSession } from 'next-auth/react'
import MovieDetails from '@/components/MovieDetails/MovieDetails'

const Movie: NextPage<MoviePageProps> = ({ id }) => {
  const { data: sessionData } = useSession()


  
  return (
    <Layout>
      <MovieDetails
        id={id}
        sessionData={sessionData}
      />
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.query.id as string

  try {
    return { props: { id } }
  } catch (error) {
    return { notFound: true} 
  }
}

export default Movie
