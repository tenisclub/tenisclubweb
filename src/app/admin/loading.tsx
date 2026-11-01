export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-52 rounded-xl bg-zinc-800/80" />
          <div className="h-4 w-80 max-w-full rounded-lg bg-zinc-800/50" />
        </div>
        <div className="h-11 w-40 rounded-xl bg-zinc-800/70" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-24 rounded-2xl border border-zinc-800/80 bg-[#121216]" />
        <div className="h-24 rounded-2xl border border-zinc-800/80 bg-[#121216]" />
        <div className="h-24 rounded-2xl border border-zinc-800/80 bg-[#121216]" />
      </div>

      <div className="rounded-3xl border border-zinc-800/80 bg-[#121216] p-5 space-y-3">
        <div className="h-10 w-full rounded-xl bg-zinc-800/50" />
        <div className="h-14 w-full rounded-xl bg-zinc-800/40" />
        <div className="h-14 w-full rounded-xl bg-zinc-800/40" />
        <div className="h-14 w-full rounded-xl bg-zinc-800/40" />
      </div>
    </div>
  );
}

