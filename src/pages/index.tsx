import { type GetServerSideProps, type NextPage } from "next";
import Layout from "@layout/default";
import MovieCard from "@/components/MovieCard/MovieCard";
import type { HomePageProps } from "@/types/main";
import Carousel from "@/components/Carousel/Carousel";
import { getUpcomingMovies } from "@/utils/getUpcomingMovies";
import { getPopularMovies } from "@/utils/getPopularMovies";

const Home: NextPage<HomePageProps> = ({ data }) => {
  const { popularMovies, upcomingMovies } = data

  const { data: { opening: moviesOpening, popularity: moviesPopular } } = popularMovies
  const { data: { upcoming: upComingMovies } } = upcomingMovies

  const popularMovieCards = moviesPopular.map((movie, idx) => {
    return <MovieCard key={idx} {...movie} />
  })

  const openingMovieCards = moviesOpening.map((movie, idx) => {
    return <MovieCard key={idx} {...movie} />
  })

  const upcomingMovieCards = upComingMovies.map((movie, idx) => {
    return <MovieCard key={idx} {...movie} />
  })

  return (
    <Layout>
      <main className="grid items-center ">
        <h2 className="text-white text-5xl text-left pl-8 pb-12">Popular</h2>
        <Carousel movieCards={popularMovieCards} />
        <h2 className="text-white text-5xl text-left pl-8 pb-12">Opening this week</h2>
        <Carousel movieCards={openingMovieCards} />
        <h2 className="text-white text-5xl text-left pl-8 pb-12">Upcoming</h2>
        <Carousel movieCards={upcomingMovieCards} />
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async () => { 
try {
  const upcomingMovies = await getUpcomingMovies()
  const popularMovies = await getPopularMovies()
  return { props: { data: {  upcomingMovies, popularMovies } } }
} catch (error) {
	return { props: { error } }
}
}


export default Home