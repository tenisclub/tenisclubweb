export default function ProductLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-pulse">
      <div className="h-4 w-48 rounded-full bg-zinc-900" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-square w-full rounded-3xl bg-[#121216] border border-zinc-800/80" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-2xl bg-[#121216] border border-zinc-800/60"
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <div className="h-4 w-24 rounded-full bg-zinc-900" />
            <div className="h-9 w-4/5 rounded-2xl bg-zinc-900" />
            <div className="h-8 w-40 rounded-xl bg-zinc-800/80" />
          </div>

          <div className="space-y-3 pt-2">
            <div className="h-4 w-32 rounded-full bg-zinc-900" />
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="h-11 rounded-xl bg-[#121216] border border-zinc-800/70"
                />
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <div className="h-13 w-full rounded-2xl bg-[#BEFA46]/20" />
            <div className="h-13 w-full rounded-2xl bg-zinc-900" />
          </div>
        </div>
      </div>
    </div>
  );
}

