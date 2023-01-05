import { type NextPage } from "next";
import Layout from "@layout/default";
import MovieCard from "@/components/MovieCard/MovieCard";
import { useQuery } from "@tanstack/react-query";
import { getNowPlayingMovies } from "../hooks/getNowPlayingMovies";


const Home: NextPage = (props) => {

  const { data, error, isLoading } = useQuery({
    queryKey: ['NowPlaying'],
    queryFn: getNowPlayingMovies,
    initalData: props
  })

if (error) return <div>Request Failed</div>;
if (isLoading) return <div>Loading...</div>;

const { results:movies } = data

  return (
    <Layout >
      <main className="flex min-h-screen flex-col items-center pt-4 bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <h2 className="text-white text-4xl">See what&apos;s now Playing</h2>
        <div className="max-w-[90%] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-4">
          {console.log(movies)}
        {movies.slice(0,12).map((movie, idx) => {
        return <MovieCard key={idx} {...movie} />
        })}
        </div>
      </main>
    </Layout>
  );
};

export const getStaticProps = async () => { 
  const movies = await getNowPlayingMovies()
  return { props: { movies } }
}

export default Home