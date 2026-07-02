'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import {
  AiFillGithub,
  AiFillGoogleCircle,
  AiFillFacebook,
  AiOutlineMail,
} from 'react-icons/ai'
import Image from 'next/image'

export default function SigninPage() {
  const [email, setEmail] = useState('')

  const handleEmailSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (!email) return
    signIn('nodemailer', {
      email,
      redirect: true,
      callbackUrl: `${window.location.origin}`,
    })
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-10 text-white">
      <h2 className="gradient-text my-4 text-center font-heading text-2xl font-extrabold sm:text-4xl">
        Create an account, <br /> add movies to watch, <br /> rate them
      </h2>

      <div className="gradient-radial my-6">
        <Image
          src="/shining.webp"
          height={1080}
          width={1920}
          priority
          alt="The Shining — Jack bursting through the door"
          className="rounded-lg"
        />
      </div>

      <div className="flex w-full flex-col items-center gap-4">
        <button
          onClick={() => signIn('github', { callbackUrl: `${window.location.origin}` })}
          className="login-btn w-full max-w-sm"
        >
          Login with Github <AiFillGithub className="ml-2" />
        </button>
        <button
          onClick={() => signIn('google', { callbackUrl: `${window.location.origin}` })}
          className="login-btn w-full max-w-sm"
        >
          Login with Google <AiFillGoogleCircle className="ml-2" />
        </button>
        <button
          onClick={() => signIn('facebook', { callbackUrl: `${window.location.origin}` })}
          className="login-btn w-full max-w-sm"
        >
          Login with Facebook <AiFillFacebook className="ml-2" />
        </button>

        <span className="my-2 inline-block h-1.5 w-3/6 bg-divider" />

        <form
          onSubmit={handleEmailSubmit}
          className="flex w-full max-w-sm flex-col items-center gap-4"
        >
          <label className="sr-only" htmlFor="email">
            Email address
          </label>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="Email address"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-pink-500"
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="login-btn w-full">
            Login with Email <AiOutlineMail className="ml-2" />
          </button>
        </form>
      </div>
    </main>
  )
}
