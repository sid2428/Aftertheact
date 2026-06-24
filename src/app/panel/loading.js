export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] animate-pulse">
      <div className="min-h-[45vh] flex items-center max-w-7xl mx-auto px-6 sm:px-12">
        <div className="h-28 w-1/2 bg-white/5 rounded-md" />
      </div>
      <div className="max-w-7xl mx-auto px-6 sm:px-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[480px] bg-[#111111] border border-white/10 rounded-md" />
        ))}
      </div>
    </div>
  );
}
