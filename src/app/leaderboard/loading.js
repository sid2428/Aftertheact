// Skeleton that mirrors the real Prophet's Wall / Leaderboard layout (see
// ./page.js): a crimson-bordered hero, then two brutalist tables — Season
// Standing and Prophet's Wall — each with a header row and ranked rows. Keeping
// the same structure, borders and accent rows means the loading state reads as
// the page settling in rather than a generic grey blur.
export default function Loading() {
  return (
    <div className="min-h-screen bg-brand-bg text-white animate-pulse">
      {/* Hero — matches the crimson-underlined title block */}
      <section className="border-b-4 border-broadcast-red bg-[#080808] px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="border-b-8 border-white/15 pb-4">
            <div className="h-12 w-3/4 max-w-2xl rounded-sm bg-white/10 sm:h-20" />
          </div>
          <div className="mt-4 h-4 w-64 rounded-sm bg-white/5" />
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl space-y-16">
          {/* Two stacked tables, the second (Prophet's Wall) with the green/gold accent rail */}
          {[{ accentRail: false }, { accentRail: true }].map((table, t) => (
            <section key={t} className="space-y-6">
              {/* Section header: title + small label */}
              <div className="flex items-end justify-between border-b-4 border-white/15 pb-3">
                <div className="h-8 w-52 rounded-sm bg-white/10" />
                <div className="h-3 w-24 rounded-sm bg-white/5" />
              </div>

              {/* The ranked table */}
              <div className="border-4 border-white/15 bg-brand-panel shadow-[var(--shadow-brutal-md)]">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={`relative flex items-center gap-3 border-b-4 border-white/10 p-3 last:border-b-0 sm:gap-4 sm:p-4 ${
                      i === 0 ? "bg-oracle-gold/[0.06]" : ""
                    } ${table.accentRail ? (i === 0 ? "border-l-8 border-l-oracle-gold" : "border-l-8 border-l-transparent") : ""}`}
                  >
                    {/* Rank */}
                    <div className="h-7 w-7 shrink-0 rounded-sm bg-white/10 sm:h-9 sm:w-10" />
                    {/* Avatar */}
                    <div className="h-10 w-10 shrink-0 rounded-sm bg-white/10 sm:h-12 sm:w-12" />
                    {/* Name + sub-label */}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-4 w-1/2 rounded-sm bg-white/10 sm:h-5" />
                      <div className="h-2.5 w-24 rounded-sm bg-white/5" />
                    </div>
                    {/* Score */}
                    <div className="shrink-0 space-y-2 text-right">
                      <div className="ml-auto h-6 w-14 rounded-sm bg-white/10" />
                      <div className="ml-auto h-2.5 w-12 rounded-sm bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
