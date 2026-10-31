export default function AccountLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-28 rounded-3xl border border-zinc-800 bg-[#121216]" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-3xl border border-zinc-800 bg-[#121216]" />
        ))}
      </div>
    </div>
  );
}

