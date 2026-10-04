export default function Loading() {
  return (
    <main className="mx-auto max-w-screen-xl animate-pulse px-4 pb-16 sm:px-8">
      <div className="flex flex-col items-center gap-6 py-10 sm:flex-row sm:items-start sm:gap-10">
        <div className="aspect-[2/3] w-40 shrink-0 rounded-xl bg-zinc-800 sm:w-52" />
        <div className="flex w-full max-w-2xl flex-col items-center gap-4 sm:items-start">
          <div className="h-10 w-64 rounded-lg bg-zinc-800" />
          <div className="h-6 w-80 max-w-full rounded-full bg-zinc-800" />
          <div className="h-4 w-full rounded bg-zinc-800" />
          <div className="h-4 w-full rounded bg-zinc-800" />
          <div className="h-4 w-2/3 rounded bg-zinc-800" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, idx) => (
          <div key={idx}>
            <div className="aspect-[2/3] rounded-xl bg-zinc-800" />
            <div className="mt-2 h-4 w-3/4 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </main>
  )
}
