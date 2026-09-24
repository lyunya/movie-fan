'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import MovieCard from '@/components/MovieCard/MovieCard'
import { api } from '@/utils/api'
import { QueryError, notify } from '@/components/ui/Feedback'
const moods = [
  { label: 'Surprise me', ids: [] as number[] },
  { label: 'Something funny', ids: [35] },
  { label: 'A little intense', ids: [28, 53] },
  { label: 'Lights off', ids: [27] },
  { label: 'Date night', ids: [10749] },
  { label: 'Mind-bending', ids: [878, 9648] },
  { label: 'Family night', ids: [10751, 16] },
]
export default function TonightClient() {
  const { status } = useSession()
  const user = api.user.query.useQuery(undefined, {
    enabled: status === 'authenticated',
  })
  const [mood, setMood] = useState(0),
    [runtime, setRuntime] = useState(120),
    [minScore, setScore] = useState(60),
    [region, setRegion] = useState('US'),
    [providers, setProviders] = useState<number[]>([]),
    [page, setPage] = useState(0),
    [exclude, setExclude] = useState<string[]>([])
  const [request, setRequest] = useState<{
    genreIds: number[]
    maxRuntime?: number
    minScore: number
    region: string
    providerIds: number[]
    surprise: number
    excludeIds: string[]
  } | null>(null)
  const savedRegion = user.data?.user?.watchRegion
  const savedProviders = user.data?.user?.preferredProviders
  useEffect(() => {
    if (savedRegion) setRegion(savedRegion)
    if (savedProviders) setProviders(savedProviders)
  }, [savedRegion, savedProviders])
  const providerOptions = api.tmdb.providers.useQuery({ region })
  const picks = api.tmdb.tonight.useQuery(
    request || { genreIds: [], minScore: 60, surprise: 0 },
    { enabled: !!request, retry: 1 }
  )
  const dismiss = api.movie.setState.useMutation({
    onError: () => notify('Could not remember that preference.', 'error'),
  })
  const choose = () => {
    const excluded = [
      ...new Set([
        ...exclude,
        ...(picks.data?.movies.map((m) => m.emsVersionId) || []),
      ]),
    ].slice(-200)
    setExclude(excluded)
    setRequest({
      genreIds: moods[mood]!.ids,
      maxRuntime: runtime || undefined,
      minScore,
      region,
      providerIds: providers,
      surprise: page,
      excludeIds: excluded,
    })
    setPage((p) => (p + 1) % 20)
  }
  return (
    <main className="page-shell">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">Less scrolling. More cinema.</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-6xl">
          What are we watching?
        </h1>
        <p className="mt-4 text-zinc-400">
          A short list for your kind of night. No account needed to explore.
        </p>
      </div>
      <section className="surface mx-auto mt-8 max-w-3xl p-5 sm:p-7">
        <fieldset>
          <legend className="text-lg font-semibold">Set the mood</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {moods.map((m, i) => (
              <button
                key={m.label}
                className="filter-chip"
                aria-pressed={i === mood}
                onClick={() => setMood(i)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            Time for a movie
            <select
              className="field"
              value={runtime}
              onChange={(e) => setRuntime(Number(e.target.value))}
            >
              <option value="90">Up to 90 minutes</option>
              <option value="120">Up to 2 hours</option>
              <option value="180">Up to 3 hours</option>
              <option value="0">Any length</option>
            </select>
          </label>
          <label className="field-label">
            Watching in
            <select
              className="field"
              value={region}
              onChange={(e) => {
                setRegion(e.target.value)
                setProviders([])
              }}
            >
              {[
                ['US', 'United States'],
                ['CA', 'Canada'],
                ['GB', 'United Kingdom'],
                ['AU', 'Australia'],
              ].map(([v, t]) => (
                <option value={v} key={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
        <details className="mt-5">
          <summary className="text-sm text-zinc-300">
            Streaming services & score ·{' '}
            {providers.length ? `${providers.length} selected` : 'All services'}
          </summary>
          <div className="mt-4 flex flex-wrap gap-2">
            {providerOptions.data?.slice(0, 30).map((p) => (
              <button
                key={p.id}
                className="filter-chip"
                aria-pressed={providers.includes(p.id)}
                onClick={() =>
                  setProviders((old) =>
                    old.includes(p.id)
                      ? old.filter((id) => id !== p.id)
                      : [...old, p.id].slice(0, 20)
                  )
                }
              >
                {p.name}
              </button>
            ))}
          </div>
          <label className="field-label mt-5">
            Minimum TMDB score: {minScore}%
            <input
              type="range"
              min={40}
              max={85}
              step={5}
              value={minScore}
              onChange={(e) => setScore(Number(e.target.value))}
            />
          </label>
        </details>
        <button
          className="btn-brand mt-6 w-full"
          disabled={picks.isFetching}
          onClick={choose}
        >
          {picks.isFetching
            ? 'Finding your films…'
            : request
              ? 'Find three more'
              : 'Find tonight’s films'}
        </button>
        {status === 'authenticated' && (
          <p className="mt-3 text-center text-xs text-zinc-400">
            Watched films and dismissed suggestions are excluded.
          </p>
        )}
      </section>
      {request && (
        <section className="mx-auto mt-10 max-w-3xl">
          {picks.isError ? (
            <QueryError retry={() => picks.refetch()} />
          ) : picks.isLoading ? (
            <div className="surface h-64 animate-pulse" />
          ) : picks.data?.movies.length ? (
            <>
              <h2 className="mb-6 text-2xl font-semibold">
                A few good possibilities
              </h2>
              <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
                {picks.data.movies.map((m, i) => (
                  <div key={m.emsVersionId} className="w-[8.5rem] sm:w-44">
                    <p className="eyebrow mb-3">{picks.data.roles[i]}</p>
                    <MovieCard {...m} />
                    <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                      {picks.data.reasons[i]}
                    </p>
                    {status === 'authenticated' && (
                      <button
                        className="mt-3 min-h-11 text-sm text-pink-300"
                        onClick={() => {
                          dismiss.mutate({
                            movieId: m.emsVersionId,
                            dismissed: true,
                          })
                          setExclude((old) => [...old, m.emsVersionId])
                          notify('We’ll leave this out of future picks')
                        }}
                      >
                        Not for me
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="surface p-8 text-center">
              <h2 className="text-xl">No films matched this round.</h2>
              <p className="mt-2 text-zinc-400">
                Try more time, another mood, or fewer service restrictions. We
                haven’t changed your filters.
              </p>
              <button className="btn-ghost mt-4" onClick={choose}>
                Try the next round
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  )
}
