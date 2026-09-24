'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import type { IWatchProviders } from './types'
import { api } from '@/utils/api'
export default function Availability({
  id,
  initial,
}: {
  id: string
  initial: IWatchProviders | null
}) {
  const { status } = useSession()
  const user = api.user.query.useQuery(undefined, {
    enabled: status === 'authenticated',
  })
  const [region, setRegion] = useState('US')
  useEffect(() => {
    if (user.data?.user?.watchRegion) setRegion(user.data.user.watchRegion)
  }, [user.data?.user?.watchRegion])
  const data = api.tmdb.availability.useQuery(
    { movieId: id, region },
    { initialData: region === 'US' ? initial : undefined, staleTime: 60_000 }
  )
  return (
    <section className="surface mt-5 p-4" aria-label="Where to watch">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Where to watch</h2>
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          Region
          <select
            className="rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-white"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            {[
              ['US', 'United States'],
              ['CA', 'Canada'],
              ['GB', 'United Kingdom'],
              ['AU', 'Australia'],
            ].map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
      {data.isError ? (
        <p role="alert" className="mt-3 text-sm">
          Availability is unavailable right now.{' '}
          <button
            className="text-pink-300 underline"
            onClick={() => data.refetch()}
          >
            Retry
          </button>
        </p>
      ) : data.isLoading ? (
        <p className="mt-3 text-sm text-zinc-400">Checking services…</p>
      ) : data.data &&
        [...data.data.flatrate, ...data.data.rent, ...data.data.buy].length ? (
        <div className="mt-3 space-y-3">
          {(
            [
              ['Included', data.data.flatrate],
              ['Rent', data.data.rent],
              ['Buy', data.data.buy],
            ] as const
          ).map(([label, providers]) =>
            providers.length ? (
              <div key={label}>
                <p className="mb-2 text-xs text-zinc-400">{label}</p>
                <div className="flex flex-wrap gap-2">
                  {providers.slice(0, 6).map((p) => (
                    <span
                      key={p.name}
                      className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-2 py-1 text-xs"
                    >
                      <Image
                        src={p.logoUrl}
                        width={24}
                        height={24}
                        alt=""
                        className="rounded"
                      />
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-zinc-400">
          No providers listed in this region.
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
        <span>Availability by JustWatch</span>
        {data.data?.link && (
          <a
            className="text-pink-300 underline"
            href={data.data.link}
            target="_blank"
            rel="noreferrer"
          >
            View provider options ↗
          </a>
        )}
      </div>
    </section>
  )
}
