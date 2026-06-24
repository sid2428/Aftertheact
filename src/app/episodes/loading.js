export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Hero */}
      <div className="min-h-[40vh] flex items-center max-w-7xl mx-auto px-6 sm:px-12">
        <div className="h-28 w-1/2 bg-white/5 rounded-md" />
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto p-6 sm:p-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[200px] bg-[#111111] border border-white/10 rounded-md" />
        ))}
      </div>
    </div>
  );
}
