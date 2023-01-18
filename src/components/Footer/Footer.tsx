import Balancer from "react-wrap-balancer"

const Footer = () => {
  return (
    <footer className="w-full pb-4 text-center text-white">
      <Balancer className="text-2xl">
        Made with ❤️ by{' '}
        <a href="https://leonmarbukh.com/" className="underline">
          Leon Marbukh
        </a>
      </Balancer>
    </footer>
  )
}

export default Footer