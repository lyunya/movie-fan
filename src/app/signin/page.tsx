import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import SigninClient from './SigninClient'
import { auth } from '@/server/auth'
import { getSiteUrl } from '@/server/siteUrl'
import { safeCallbackUrl } from '@/utils/callbackUrl'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your Movie Fan watchlist, diary, and movie nights.',
  robots: { index: false, follow: false },
}

interface SigninPageProps {
  searchParams: Promise<{ callbackUrl?: string | string[] }>
}

export default async function SigninPage({ searchParams }: SigninPageProps) {
  const params = await searchParams
  const callbackUrl = safeCallbackUrl(params.callbackUrl, getSiteUrl())
  const session = await auth()

  if (session) redirect(callbackUrl === '/signin' ? '/' : callbackUrl)

  return <SigninClient callbackUrl={callbackUrl} />
}
