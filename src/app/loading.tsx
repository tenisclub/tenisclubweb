export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-pulse">
      <div className="h-52 rounded-3xl bg-[#14141A] border border-zinc-800/70" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-96 rounded-2xl bg-[#14141A] border border-zinc-800/70"
          />
        ))}
      </div>
    </div>
  );
}
