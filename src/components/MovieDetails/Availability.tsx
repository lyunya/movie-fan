'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import RegionOptions from '@/components/RegionOptions/RegionOptions'
import { useRegion } from '@/hooks/useRegion'
import type { RegionCode } from '@/server/availability/regions'
import type { WhereToWatch } from '@/server/catalog/types'
import { filmImage } from '@/utils/film'
import { api } from '@/utils/api'
export default function Availability({
  id,
  initial,
}: {
  id: string
  initial: WhereToWatch | null
}) {
  const preferred = useRegion().region
  const [region, setRegion] = useState<RegionCode>(preferred)
  // Follow the saved or guessed Region until the Member picks another here
  const [picked, setPicked] = useState(false)
  useEffect(() => {
    if (!picked) setRegion(preferred)
  }, [preferred, picked])
  const data = api.availability.whereToWatch.useQuery(
    { filmId: id, region },
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
            onChange={(e) => {
              setPicked(true)
              setRegion(e.target.value as RegionCode)
            }}
          >
            <RegionOptions />
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
        [
          ...data.data.subscription,
          ...data.data.free,
          ...data.data.ads,
          ...data.data.rent,
          ...data.data.buy,
        ].length ? (
        <div className="mt-3 space-y-3">
          {(
            [
              ['Included', data.data.subscription],
              ['Free', [...data.data.free, ...data.data.ads]],
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
                      {p.logoPath && (
                        <Image
                          src={filmImage(p.logoPath, 'w92')!}
                          width={24}
                          height={24}
                          alt=""
                          className="rounded"
                        />
                      )}
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
