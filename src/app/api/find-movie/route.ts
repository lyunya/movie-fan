/**
 * Bridges TMDB filmography items back onto this app's Flixster-keyed movie
 * pages: search Flixster by title, pick the best match (exact title + year,
 * then exact title, then first hit), and redirect to /movie/<emsVersionId>.
 * When nothing matches, fall back to the in-app search for the title so the
 * user still lands somewhere useful.
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchSearch } from '@/server/flixster'

const normalize = (value: string) => value.trim().toLowerCase()

type SearchHit = {
  emsVersionId?: string
  name?: string
  releaseDate?: string
}

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get('title')?.trim()
  const year = request.nextUrl.searchParams.get('year')?.trim()

  if (!title) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const searchFallback = new URL(
    `/?q=${encodeURIComponent(title)}`,
    request.url
  )

  let hits: SearchHit[] = []
  try {
    hits = ((await fetchSearch(title)) as SearchHit[]).filter(
      (hit) => hit.emsVersionId && hit.name
    )
  } catch {
    return NextResponse.redirect(searchFallback)
  }

  const wanted = normalize(title)
  const exact = hits.filter((hit) => normalize(hit.name!) === wanted)
  const best =
    (year && exact.find((hit) => hit.releaseDate?.startsWith(year))) ||
    exact[0] ||
    hits[0]

  if (!best) {
    return NextResponse.redirect(searchFallback)
  }

  return NextResponse.redirect(
    new URL(`/movie/${best.emsVersionId}`, request.url)
  )
}
