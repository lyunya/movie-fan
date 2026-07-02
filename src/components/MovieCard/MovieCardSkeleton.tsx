const MovieCardSkeleton = () => (
  <div className="w-36 shrink-0 animate-pulse sm:w-44">
    <div className="aspect-[2/3] rounded-xl border border-zinc-800 bg-zinc-800/60" />
    <div className="mt-2 h-3 w-3/4 rounded bg-zinc-800/60" />
    <div className="mt-1.5 h-2.5 w-1/3 rounded bg-zinc-800/60" />
  </div>
)

export default MovieCardSkeleton
