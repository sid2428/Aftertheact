export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] animate-pulse">
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6">
        <div className="h-8 w-48 bg-white/5 rounded-sm" />
        <div className="h-24 w-3/4 max-w-2xl bg-white/5 rounded-md" />
      </div>

      <div className="max-w-7xl mx-auto p-6 sm:p-12 grid lg:grid-cols-2 gap-12">
        {Array.from({ length: 2 }).map((_, col) => (
          <div key={col} className="space-y-4">
            <div className="h-8 w-40 bg-white/5 rounded-sm" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border border-brand-border rounded-md bg-[#111111]">
                <div className="w-10 h-10 bg-white/5 rounded-sm" />
                <div className="w-12 h-12 bg-white/5 rounded-sm" />
                <div className="flex-1 h-5 bg-white/5 rounded-sm" />
                <div className="h-8 w-12 bg-white/5 rounded-sm" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
