import Balancer from "react-wrap-balancer"

const Footer = () => {
  return (
    <footer className="w-full bg-[#1e1e1e] pb-4 text-white text-center">
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