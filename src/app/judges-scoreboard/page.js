import { getServiceSupabase } from "@/lib/supabase";
import { getPanelMembers } from "@/lib/panel";
import { aggregateRatings } from "@/lib/judges";
import Link from "next/link";

export const metadata = {
  title: "Judge Popularity",
  description: "Which judge the jury actually rates — by votes and average score.",
  alternates: { canonical: "/judges-scoreboard" },
};

export const revalidate = 60;

export default async function JudgesScoreboardPage() {
  const judges = await getPanelMembers();
  const supabase = getServiceSupabase();

  const { data } = await supabase.from("JudgeRating").select("judge_id, overall_score, tag");
  const byJudge = {};
  for (const row of data || []) {
    (byJudge[row.judge_id] ||= []).push(row);
  }

  const ranked = judges
    .map((j) => ({ ...j, agg: aggregateRatings(byJudge[j.id] || []) }))
    .sort((a, b) => (b.agg.count - a.agg.count) || (b.agg.avgOverall - a.agg.avgOverall));

  return (
    <div className="min-h-screen bg-[#0A0A0A] selection:bg-latent-crimson/30">
      <section className="relative overflow-hidden min-h-[35vh] flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,_var(--tw-gradient-stops))] from-latent-gold/8 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-12 relative z-10">
          <Link href="/panel" className="text-sm text-latent-gold hover:underline">← Judge the Judges</Link>
          <h1 className="mt-4 text-5xl sm:text-7xl font-display font-black tracking-tighter uppercase text-white leading-[0.85]">
            JUDGE<br />POPULARITY
          </h1>
          <p className="text-xl text-white/60 font-medium mt-4">Ranked by votes cast, then average score.</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 sm:px-12 pb-32">
        <div className="space-y-0 rounded-md overflow-hidden border border-brand-border bg-[#111111] shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          {ranked.map((j, idx) => (
            <div key={j.id} className="group relative border-b last:border-b-0 border-brand-border hover:bg-white/5 transition-colors p-4 flex items-center gap-4">
              <div className="font-mono font-black text-2xl sm:text-3xl text-white/10 w-10 sm:w-12 text-center group-hover:text-latent-gold transition-colors">#{idx + 1}</div>

              <div className="relative w-12 h-12 border border-brand-border bg-[#0A0A0A] overflow-hidden shrink-0 rounded-sm">
                {j.image ? (
                  <img src={j.image} alt={j.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-display font-black text-xl text-white/10 uppercase">{j.name?.[0] || "?"}</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-white group-hover:text-latent-gold-light transition-colors truncate">
                  {j.name}
                </div>
                {j.agg.topTag && (
                  <div className="text-[10px] font-display font-black uppercase tracking-widest text-white/50 truncate mt-0.5">{j.agg.topTag}</div>
                )}
              </div>

              <div className="text-right shrink-0">
                <div className="font-mono font-black text-2xl sm:text-3xl text-latent-gold tracking-tighter drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">
                  {j.agg.avgOverall.toFixed(1)}
                </div>
                <div className="text-[10px] font-display font-black uppercase tracking-widest text-white/40">{j.agg.count} {j.agg.count === 1 ? "vote" : "votes"}</div>
              </div>
            </div>
          ))}

          {ranked.length === 0 && (
            <div className="text-center py-16 bg-[#111111] text-white/30 font-display font-black uppercase tracking-widest text-xl">
              No judges on the panel yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
