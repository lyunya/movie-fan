import { type GetServerSideProps, type NextPage } from "next";
import Layout from "@layout/default";
import MovieCard from "@/components/MovieCard/MovieCard";
import { getNowPlayingMovies } from "@util/getNowPlayingMovies";
import type { HomePageProps } from "@/types/main";



const Home: NextPage<HomePageProps> = ({ data }) => {

const { results:movies } = data

  return (
    <Layout >
      <main className="flex min-h-screen flex-col items-center pt-4 bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <h2 className="text-white text-5xl my-8">See what&apos;s now Playing</h2>
        <div className="max-w-[90%] grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 my-8">
        {movies.slice(0,12).map((movie, idx) => {
        return <MovieCard key={idx} {...movie} />
        })}
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async () => { 
try {
	  const data = await getNowPlayingMovies()
	  return { props: { data } }
} catch (error) {
	return { props: { error } }
}
}


export default Home