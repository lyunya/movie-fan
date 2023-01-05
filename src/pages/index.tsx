import { type NextPage } from "next";
import Link from "next/link";
import Layout from "@layout/default";


const Home: NextPage = () => {

  return (
    <Layout >
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <Link href={"/movies"} className="text-white text-4xl mt-4">See what&apos;s now Playing</Link>
        <div className="flex flex-col items-center gap-2">
        </div>
      </main>
    </Layout>
  );
};

export default Home;


