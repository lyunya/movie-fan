'use client'

import Image from 'next/image'
import Link from 'next/link'

import MovieCard from '@/components/MovieCard/MovieCard'
import { api } from '@/utils/api'

export default function SharedListClient({ id }: { id: string }) {
  const list = api.lists.publicById.useQuery({ id }, { retry: false })

  if (list.isLoading) return <main className="min-h-[65vh]" />
  if (!list.data) {
    return (
      <main className="mx-auto min-h-[65vh] max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-semibold">List not available</h1>
        <p className="mt-3 text-zinc-400">
          It may be private or no longer exist.
        </p>
        <Link href="/" className="btn-brand mt-6">
          Explore movies
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto w-11/12 max-w-screen-xl pb-16 pt-10">
      <header className="flex flex-col items-center text-center">
        {list.data.items.find((i) => i.movieId === list.data?.coverMovieId)
          ?.posterImage && (
          <Image
            src={
              list.data.items.find(
                (i) => i.movieId === list.data?.coverMovieId
              )!.posterImage!
            }
            width={120}
            height={180}
            alt={`${list.data.name} cover`}
            className="mb-5 rounded-xl border border-zinc-700"
          />
        )}
        <Image
          src={list.data.user.image || '/avatar.png'}
          width={72}
          height={72}
          alt="List creator"
          className="h-16 w-16 rounded-full object-cover"
        />
        <p className="mt-3 text-sm text-zinc-500">
          A list by{' '}
          <Link
            prefetch={false}
            className="text-pink-300"
            href={`/u/${list.data.user.handle || list.data.user.id}`}
          >
            {list.data.user.name || 'a movie fan'}
          </Link>
        </p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">
          {list.data.name}
        </h1>
        {list.data.description && (
          <p className="mt-3 max-w-2xl text-zinc-400">
            {list.data.description}
          </p>
        )}
      </header>
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {list.data.items.map((item, index) => (
          <div key={item.id}>
            <MovieCard
              rank={list.data.ranked ? index + 1 : undefined}
              key={item.id}
              name={item.name}
              emsVersionId={item.movieId}
              posterImage={item.posterImage}
              releaseDate={item.releaseDate}
              tomatoMeter={item.tomatoMeter}
            />
            {item.note && (
              <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-300">
                {item.note}
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
