'use client'
/**
 * The Region to show where-to-watch for: the Member's saved Region, or for
 * guests a guess from their browser languages (else US), plus the Member's
 * chosen services.
 */
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  DEFAULT_REGION,
  guessRegion,
  isRegion,
  type RegionCode,
} from '@/server/availability/regions'
import { api } from '@/utils/api'

export function useRegion() {
  const { status } = useSession()
  const member = api.user.query.useQuery(undefined, {
    enabled: status === 'authenticated',
  })
  // Guessed after mount so server and client render the same first frame
  const [guess, setGuess] = useState<RegionCode>(DEFAULT_REGION)
  useEffect(() => {
    setGuess(
      guessRegion(
        navigator.languages?.length ? navigator.languages : [navigator.language]
      )
    )
  }, [])
  const saved = member.data?.user?.watchRegion
  return {
    region: isRegion(saved) ? saved : guess,
    services: member.data?.user?.preferredProviders ?? [],
    /** True once we know whether a saved Region applies */
    settled:
      status !== 'loading' && (status !== 'authenticated' || !member.isLoading),
  }
}
