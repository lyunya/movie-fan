import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import SigninClient from './SigninClient'
import { auth } from '@/server/auth'
import { getSiteUrl } from '@/server/siteUrl'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your Movie Fan watchlist, diary, and movie nights.',
  robots: { index: false, follow: false },
}

interface SigninPageProps {
  searchParams: Promise<{ callbackUrl?: string | string[] }>
}

const safeCallbackUrl = (value?: string | string[]) => {
  const candidate = Array.isArray(value) ? value[0] : value
  if (!candidate) return '/'
  if (candidate.startsWith('/') && !candidate.startsWith('//')) return candidate

  try {
    const callback = new URL(candidate)
    if (callback.origin === new URL(getSiteUrl()).origin)
      return callback.toString()
  } catch {
    // Invalid or cross-origin callback URLs should never leave Movie Fan.
  }

  return '/'
}

export default async function SigninPage({ searchParams }: SigninPageProps) {
  const params = await searchParams
  const callbackUrl = safeCallbackUrl(params.callbackUrl)
  const session = await auth()

  if (session) redirect(callbackUrl === '/signin' ? '/' : callbackUrl)

  return <SigninClient callbackUrl={callbackUrl} />
}
