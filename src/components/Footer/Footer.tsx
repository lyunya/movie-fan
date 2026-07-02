import Balancer from 'react-wrap-balancer'

const Footer = () => {
  return (
    <footer className="mt-auto w-full border-t border-zinc-800/80 py-6 text-center text-zinc-400">
      <Balancer className="text-sm sm:text-base">
        Made with ❤️ by{' '}
        <a
          href="https://leonmarbukh.com/"
          className="text-zinc-200 underline decoration-pink-500 underline-offset-4 transition hover:text-pink-400"
        >
          Leon Marbukh
        </a>
      </Balancer>
    </footer>
  )
}

export default Footer
