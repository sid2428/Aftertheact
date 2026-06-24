export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] animate-pulse">
      {/* Sticky header skeleton */}
      <div className="border-b border-brand-border p-4 sm:p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          <div className="h-10 w-1/2 bg-white/5 rounded-sm" />
          <div className="h-8 w-28 bg-white/5 rounded-sm" />
        </div>
      </div>

      {/* Mini band */}
      <div className="border-b border-brand-border h-[90px] max-w-7xl mx-auto" />

      {/* Contestant rows */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-12 space-y-12">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 aspect-square bg-[#111111] border border-brand-border rounded-md" />
            <div className="flex-1 bg-[#111111] border border-brand-border rounded-md min-h-[300px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
