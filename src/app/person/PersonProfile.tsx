'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

import { api } from '@/utils/api'
import { PERSON_PLACEHOLDER, filmImage } from '@/utils/film'

import Filmography from './Filmography'
import FollowNews from '@/components/ui/FollowNews'

const rtSearchUrl = (name: string) =>
  `https://www.rottentomatoes.com/search?search=${encodeURIComponent(name)}`

// A readable name for metadata / the fallback UI before TMDB data loads:
// strip a leading id from an `<id>-<name>` slug, else use the decoded slug.
const displayNameFromSlug = (slug: string) => {
  return slug.replace(/^\d+-/, '').replace(/-/g, ' ')
}

export function PersonLoading() {
  return (
    <main className="mx-auto max-w-screen-md px-4 py-24 text-center text-white sm:px-8">
      <p role="status" className="text-zinc-400">
        Loading profile…
      </p>
    </main>
  )
}

export default function PersonProfile() {
  const pathname = usePathname()
  const [slug, setSlug] = useState<string | null>(null)
  // The address in the browser keeps /person/<slug> after the rewrite. Read
  // it after hydration so the shared static HTML never depends on a slug or
  // on the destination's query string (which isn't in the visible URL).
  useEffect(() => {
    const encoded = pathname?.match(/^\/person\/([^/]+)\/?$/)?.[1] ?? ''
    try {
      setSlug(decodeURIComponent(encoded))
    } catch {
      setSlug('')
    }
  }, [pathname])
  const decoded = displayNameFromSlug(slug ?? '')
  const {
    data: person,
    isLoading,
    isError,
    refetch,
  } = api.catalog.person.useQuery(
    { slug: slug ?? '' },
    { enabled: !!slug, staleTime: 24 * 60 * 60 * 1000, retry: false }
  )

  useEffect(() => {
    document.title = `${person?.name || decoded || 'Person'} · Movie Fan`
  }, [person?.name, decoded])

  if (slug === null || isLoading) return <PersonLoading />

  if (!person) {
    return (
      <main className="mx-auto max-w-screen-md px-4 py-24 text-center text-white sm:px-8">
        <h1 className="text-3xl font-semibold sm:text-4xl">
          {decoded || 'Person'}
        </h1>
        <p className="mt-4 text-zinc-400">
          We couldn&apos;t load a profile for this person right now.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {isError && (
            <button className="btn-ghost" onClick={() => void refetch()}>
              Try again
            </button>
          )}
          <a
            href={rtSearchUrl(decoded)}
            target="_blank"
            rel="noreferrer"
            className="btn-brand"
          >
            Find them on Rotten Tomatoes
          </a>
          <Link href="/" className="btn-ghost">
            Back to home
          </Link>
        </div>
      </main>
    )
  }

  const facts = [
    person.knownForDepartment && `Known for ${person.knownForDepartment}`,
    person.birthday &&
      `Born ${person.birthday}${person.deathday ? ` — died ${person.deathday}` : ''}`,
    person.placeOfBirth,
  ].filter(Boolean) as string[]

  const bioParagraphs = (person.biography || '')
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return (
    <main className="mx-auto max-w-screen-xl px-4 pb-16 text-white sm:px-8">
      {/* Profile header */}
      <div className="flex flex-col items-center gap-6 py-10 sm:flex-row sm:items-start sm:gap-10">
        <div className="relative aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-xl border border-zinc-700 shadow-2xl sm:w-52">
          <Image
            src={filmImage(person.profilePath, 'w500') || PERSON_PLACEHOLDER}
            fill
            priority
            sizes="(max-width: 640px) 45vw, 210px"
            alt={`${person.name} portrait`}
            className="object-cover"
          />
        </div>

        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-semibold sm:text-5xl">{person.name}</h1>
          <div className="mt-4">
            <FollowNews subject={person.name} />
          </div>

          {facts.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              {facts.map((fact) => (
                <span key={fact} className="chip">
                  {fact}
                </span>
              ))}
            </div>
          )}

          {bioParagraphs.length > 0 && (
            <div className="mt-5 max-w-2xl space-y-3 text-left leading-relaxed text-zinc-300">
              {bioParagraphs.slice(0, 1).map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
              {bioParagraphs.length > 1 && (
                <details className="group">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-pink-400 transition hover:text-pink-300">
                    <span className="group-open:hidden">Read full bio</span>
                    <span className="hidden group-open:inline">Show less</span>
                  </summary>
                  <div className="mt-3 space-y-3">
                    {bioParagraphs.slice(1).map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      </div>

      <Filmography key={person.id} credits={person.credits} />
    </main>
  )
}
