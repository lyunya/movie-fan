'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import Image from 'next/image'
import { signIn } from 'next-auth/react'
import {
  AiFillFacebook,
  AiFillGithub,
  AiFillGoogleCircle,
  AiOutlineMail,
} from 'react-icons/ai'
import { HiCheck } from 'react-icons/hi'

type Provider = 'google' | 'github' | 'facebook' | 'nodemailer'

const BENEFITS = ['Tonight picks', 'Diary & reviews', 'Movie-night voting']

const socialButtonClass =
  'flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 disabled:cursor-wait disabled:opacity-50'

export default function SigninClient({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState<Provider | null>(null)

  const startProvider = async (provider: Exclude<Provider, 'nodemailer'>) => {
    setPending(provider)
    try {
      await signIn(provider, { callbackUrl })
    } catch {
      setError('Sign-in could not be started. Please try again.')
    } finally {
      setPending(null)
    }
  }

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim()) return

    setPending('nodemailer')
    try {
      await signIn('nodemailer', {
        email: email.trim(),
        redirect: true,
        callbackUrl,
      })
    } catch {
      setError('Sign-in could not be started. Please try again.')
    } finally {
      setPending(null)
    }
  }

  const isPending = pending != null

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-5 text-white sm:px-6 sm:py-7 lg:py-3">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-1/3 h-80 w-80 rounded-full bg-pink-600/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-red-600/10 blur-3xl"
      />

      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/90 shadow-2xl shadow-black/50 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden min-h-[520px] overflow-hidden lg:block">
          <Image
            src="/shining.webp"
            fill
            sizes="(min-width: 1024px) 520px, 0px"
            alt=""
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-9">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-400">
              Your movie life, remembered
            </p>
            <h2 className="mt-3 max-w-md font-heading text-3xl font-bold leading-tight text-white">
              Spend less time scrolling. Watch something great.
            </h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {BENEFITS.map((benefit) => (
                <span
                  key={benefit}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-xs font-semibold text-zinc-200 backdrop-blur"
                >
                  <HiCheck className="h-4 w-4 text-pink-400" />
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex min-h-[540px] flex-col justify-center p-5 sm:p-9 lg:min-h-[520px] lg:p-10">
          <div className="mx-auto w-full max-w-md">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-pink-400">
              Movie Fan
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              Your next chapter starts here
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-base">
              Sign in to sync your watchlist, diary, ratings, and movie nights.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => startProvider('google')}
                disabled={isPending}
                className={`${socialButtonClass} sm:col-span-2 sm:bg-white sm:text-zinc-950 sm:hover:bg-zinc-200`}
              >
                <AiFillGoogleCircle className="h-5 w-5" />
                {pending === 'google'
                  ? 'Opening Google…'
                  : 'Continue with Google'}
              </button>
              <button
                type="button"
                onClick={() => startProvider('github')}
                disabled={isPending}
                className={socialButtonClass}
              >
                <AiFillGithub className="h-5 w-5" />
                {pending === 'github' ? 'Opening…' : 'GitHub'}
              </button>
              <button
                type="button"
                onClick={() => startProvider('facebook')}
                disabled={isPending}
                className={socialButtonClass}
              >
                <AiFillFacebook className="h-5 w-5 text-blue-400" />
                {pending === 'facebook' ? 'Opening…' : 'Facebook'}
              </button>
            </div>

            <div className="my-6 flex items-center gap-3" aria-hidden>
              <span className="h-px flex-1 bg-zinc-800" />
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                or use email
              </span>
              <span className="h-px flex-1 bg-zinc-800" />
            </div>

            {error && (
              <p role="alert" className="mb-4 text-sm text-red-300">
                {error}
              </p>
            )}
            <form onSubmit={handleEmailSubmit}>
              <label
                className="text-sm font-semibold text-zinc-300"
                htmlFor="email"
              >
                Email address
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={email}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  disabled={isPending}
                  className="min-h-12 min-w-0 flex-1 rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 disabled:opacity-50"
                  onChange={(event) => setEmail(event.target.value)}
                />
                <button
                  type="submit"
                  disabled={isPending || !email.trim()}
                  className="btn-brand min-h-12 shrink-0 rounded-xl px-5 py-3 font-sans"
                >
                  <AiOutlineMail className="h-5 w-5" />
                  {pending === 'nodemailer' ? 'Sending…' : 'Email me a link'}
                </button>
              </div>
            </form>

            <p className="mt-4 text-center text-xs leading-relaxed text-zinc-600">
              No password required. Email is used for sign-in and any streaming
              alerts you choose to enable.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
