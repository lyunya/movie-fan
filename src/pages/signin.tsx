import { signIn } from 'next-auth/react'
import { useState } from 'react'
import {
  AiFillGithub,
  AiFillGoogleCircle,
  AiFillFacebook,
  AiOutlineMail,
} from 'react-icons/ai'
import Footer from '@/components/Footer/Footer'
import Image from 'next/image'
import Link from 'next/link'

const Signin = () => {
  const [email, setEmail] = useState('')

  const handleEmailSubmit = (e: { preventDefault: () => void }) => { 
    e.preventDefault()
    if(!email) return false

    signIn('email', { email, redirect: true, callbackUrl: `${window.location.origin}` })
  }
  return (
    <div className="flex flex-col items-center bg-gradient-to-b from-[#000000] to-[#1e1e1e] px-4">
      <div className="container flex min-h-screen w-full flex-col items-start justify-between px-7 pb-7 pt-3 text-white xl:w-5/12">
        <Link className="mx-auto" href="/">
          <h1 className="mt-8 bg-gradient-to-br from-pink-400 to-red-600 bg-clip-text font-heading text-5xl font-extrabold text-transparent sm:text-3xl">
            Movie Fan
          </h1>
        </Link>
        <main className="mx-auto lg:my-12">
          <h2 className="text-outline-violet-700 my-4 bg-gradient-to-br from-pink-400 to-red-600 bg-clip-text text-center font-heading text-2xl font-extrabold text-transparent sm:text-3xl lg:text-6xl">
            Create account, <br /> Add movies to watch, <br />
            Rate them
          </h2>
          <div className="gradient-radial">
            <Image
              src={'/shining.webp'}
              height={1080}
              width={1920}
              priority
              alt="The Shining Jack busting through the door"
            />
          </div>
          <div className="my-12 flex flex-col items-center gap-5">
            <button
              onClick={() =>
                signIn('github', {
                  callbackUrl: `${window.location.origin}`,
                })
              }
              className="login-btn flex items-center"
            >
              Login with Github <AiFillGithub style={{ marginLeft: '8px' }} />{' '}
            </button>
            <button
              onClick={() =>
                signIn('google', {
                  callbackUrl: `${window.location.origin}`,
                })
              }
              className="login-btn flex items-center"
            >
              Login with Google{' '}
              <AiFillGoogleCircle style={{ marginLeft: '8px' }} />{' '}
            </button>
            <button
              onClick={() =>
                signIn('facebook', {
                  callbackUrl: `${window.location.origin}`,
                })
              }
              className="login-btn flex items-center"
            >
              Login with Facebook{' '}
              <AiFillFacebook style={{ marginLeft: '8px' }} />{' '}
            </button>
            <span className="inline-block h-1.5 w-3/6 bg-divider" />
            <form
              onSubmit={handleEmailSubmit}
              className="flex flex-col justify-center"
            >
              <label className="sr-only" htmlFor="email">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="Email Address"
                className="rounded px-1 text-black"
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="submit"
                className="login-btn mt-4 flex items-center"
              >
                Login with Email <AiOutlineMail style={{ marginLeft: '8px' }} />{' '}
              </button>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}

export default Signin