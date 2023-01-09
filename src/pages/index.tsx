import { type GetServerSideProps, type NextPage } from "next";
import Layout from "@layout/default";
import MovieCard from "@/components/MovieCard/MovieCard";
import type { HomePageProps } from "@/types/main";
import Carousel from "@/components/Carousel/Carousel";
import { getUpcomingFlix } from "@/utils/getUpcomingFlix";
import { getOpeningFlix } from "@/utils/getOpeningFlix";
import { getPopularMovies } from "@/utils/getPopularMovies";

const Home: NextPage<HomePageProps> = ({ data }) => {
  const { popularMovies, upcomingFlix } = data

  const { data: { opening: moviesOpening, popularity: moviesPopular } } = popularMovies
  const { data: { upcoming: moviesUpcomingFlix } } = upcomingFlix

  const popularMovieCards = moviesPopular.map((movie, idx) => {
    return <MovieCard key={idx} {...movie} />
  })

  const openingMovieCards = moviesOpening.map((movie, idx) => {
    return <MovieCard key={idx} {...movie} />
  })

  const upcomingMovieCards = moviesUpcomingFlix.map((movie, idx) => {
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
  const upcomingFlix = await getUpcomingFlix()
  const popularMovies = await getPopularMovies()
  return { props: { data: {  upcomingFlix, popularMovies } } }
} catch (error) {
	return { props: { error } }
}
}


export default Home