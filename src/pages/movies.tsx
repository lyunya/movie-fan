import { type NextPage } from "next";
import Layout from "@layout/default";
// import nowPlayingMovies from '../data/nowPlaying.json'

const movies: NextPage = () => {
  // const currentMovies = nowPlayingMovies;
  return (
    <Layout >
      {/* <h2> {currentMovies.map(movie => movie.title)}</h2>  */}
      <h2>Leon</h2>
      </Layout>
  )
}

export default movies