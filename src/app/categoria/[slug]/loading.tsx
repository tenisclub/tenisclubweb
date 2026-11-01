export default function CategoryLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
      <div className="space-y-2.5">
        <div className="h-9 w-64 rounded-2xl bg-zinc-900" />
        <div className="h-4 w-80 max-w-full rounded-full bg-zinc-900/70" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-zinc-800/80 bg-[#121216] overflow-hidden"
          >
            <div className="aspect-square bg-zinc-900/80" />
            <div className="p-4 space-y-2.5">
              <div className="h-3 w-16 rounded-full bg-zinc-800" />
              <div className="h-5 w-4/5 rounded-lg bg-zinc-800" />
              <div className="h-6 w-28 rounded-lg bg-zinc-800/70" />
            </div>
          </div>
// step 3/4
