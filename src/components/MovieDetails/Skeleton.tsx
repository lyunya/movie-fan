const MovieSkeleton = () => {
  return (
    <div role="status" className="animate-pulse">
      <div className="relative">
        <div className="mx-auto flex max-w-screen-xl flex-col gap-8 px-4 py-8 sm:flex-row sm:px-8">
          {/* Poster */}
          <div className="mx-auto aspect-[2/3] w-48 shrink-0 rounded-xl bg-zinc-800/70 sm:mx-0 sm:w-60" />
          {/* Meta */}
          <div className="flex-1 space-y-4">
            <div className="h-9 w-3/4 rounded bg-zinc-800/70" />
            <div className="flex gap-2">
              <div className="h-7 w-16 rounded-full bg-zinc-800/70" />
              <div className="h-7 w-20 rounded-full bg-zinc-800/70" />
              <div className="h-7 w-14 rounded-full bg-zinc-800/70" />
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-24 rounded bg-zinc-800/70" />
              <div className="h-10 w-24 rounded bg-zinc-800/70" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-3 w-full rounded bg-zinc-800/70" />
              <div className="h-3 w-11/12 rounded bg-zinc-800/70" />
              <div className="h-3 w-4/5 rounded bg-zinc-800/70" />
            </div>
            <div className="h-12 w-48 rounded-full bg-zinc-800/70" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}

export default MovieSkeleton
