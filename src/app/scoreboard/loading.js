export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] animate-pulse">
      {/* Hero */}
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6">
        <div className="h-8 w-64 bg-white/5 rounded-sm" />
        <div className="h-24 w-3/4 max-w-2xl bg-white/5 rounded-md" />
        <div className="h-6 w-1/2 max-w-xl bg-white/5 rounded-sm" />
      </div>

      {/* Rows */}
      <div className="max-w-6xl mx-auto p-6 sm:p-12 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 p-4 border border-brand-border rounded-md bg-[#111111]">
            <div className="w-12 h-12 bg-white/5 rounded-sm" />
            <div className="w-20 h-20 bg-white/5 rounded-sm shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-6 w-1/2 bg-white/5 rounded-sm" />
              <div className="h-4 w-1/3 bg-white/5 rounded-sm" />
            </div>
            <div className="h-12 w-16 bg-white/5 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
