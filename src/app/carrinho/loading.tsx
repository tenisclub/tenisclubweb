export default function CartLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-3.5 w-24 rounded-full bg-[#BEFA46]/30" />
        <div className="h-9 w-72 rounded-2xl bg-zinc-900" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-3xl border border-zinc-800 bg-[#121216]"
            />
          ))}
        </div>
        <div className="lg:col-span-4">
          <div className="h-64 rounded-3xl border border-zinc-800 bg-[#121216]" />
// step 3/4
