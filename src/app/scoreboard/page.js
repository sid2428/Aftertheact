import { getServiceSupabase } from "@/lib/supabase";
import Image from "next/image";
import { ScoreboardHero } from "@/components/ScoreboardHero";

export const metadata = {
  title: "The Verdict Board",
  description: "Every score. Every receipt. The community's running judgement of every act.",
};

export const revalidate = 60; // ISR cache 60 seconds

export default async function CommunityScoreboard() {
  const supabase = getServiceSupabase();
  
  const { data: rankings } = await supabase
    .from("ContestantEpisodeAppearance")
    .select(`
      id,
      latent_score,
      total_votes_raw,
      controversy_flag,
      Contestant (
        id, name, slug, talent_type, image_url, is_removed_by_request
      ),
      Episode (
        id, season_number, episode_number
      )
    `)
    .not("latent_score", "is", null)
    .order("latent_score", { ascending: false });

  // Top scores first; top 3 go on the podium, the rest fall into the list.
  const valid = (rankings || []).filter((r) => r.Contestant && !r.Contestant.is_removed_by_request);
  const podium = valid.slice(0, 3);
  const rest = valid.slice(3);
  // Display order: 3rd (left), 1st (middle), 2nd (right)
  const podiumOrder = [podium[2], podium[0], podium[1]].map((entry, i) => ({ entry, place: [3, 1, 2][i] }));

  return (
    <div className="min-h-screen bg-[#0A0A0A] selection:bg-latent-crimson/30">

      {/* Full Viewport Hero */}
      <ScoreboardHero topThree={podium.map((e) => ({ name: e.Contestant.name, image_url: e.Contestant.image_url }))} />

      {/* Podium - Top 3 */}
      {podium.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 mt-12 sm:mt-24 relative z-20">
          <div className="flex justify-center items-end gap-4 sm:gap-10">
            {podiumOrder.map(({ entry, place }) => {
              if (!entry) return null;
              const c = entry.Contestant;
              const isFirst = place === 1;
              const ring = place === 1 ? "border-latent-gold shadow-[0_0_40px_rgba(212,175,55,0.4)]" : place === 2 ? "border-white/40" : "border-latent-crimson/50";
              const size = isFirst ? "w-28 h-28 sm:w-40 sm:h-40" : "w-20 h-20 sm:w-28 sm:h-28";
              return (
                <div key={entry.id} className={`flex flex-col items-center text-center ${isFirst ? "mb-8 sm:mb-16" : ""}`}>
                  <div className="mb-2">
                    <div className="text-[9px] sm:text-[10px] font-display font-black uppercase tracking-[0.3em] text-white/30">Rank</div>
                    <div className="text-2xl sm:text-4xl font-display font-black text-white/40 leading-none">{place}</div>
                  </div>
                  <div className={`relative rounded-full overflow-hidden border-4 ${ring} ${size} bg-[#111111] flex items-center justify-center`}>
                    {c.image_url ? (
                      <Image src={c.image_url} alt={c.name} fill sizes="160px" className="object-cover" unoptimized />
                    ) : (
                      <span className="font-display font-black text-3xl sm:text-5xl text-white/20">{c.name[0]}</span>
                    )}
                  </div>
                  <div className={`mt-3 font-display font-black uppercase truncate max-w-[120px] sm:max-w-[180px] ${isFirst ? "text-xl sm:text-2xl text-latent-gold-light" : "text-base sm:text-lg text-white"}`}>{c.name}</div>
                  <div className={`font-mono font-black tracking-tighter ${isFirst ? "text-4xl sm:text-6xl text-latent-gold" : "text-3xl sm:text-4xl text-white/80"}`}>{entry.latent_score.toFixed(1)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* The rest of the Scoreboard */}
      <div className="max-w-6xl mx-auto p-6 sm:p-12 mt-12 sm:mt-16 mb-32 relative z-20">
        <div className="scoreboard-table-wrapper space-y-0 rounded-md overflow-hidden border border-brand-border bg-[#111111] shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <div className="hidden sm:grid grid-cols-[80px_1fr_120px] gap-6 p-4 border-b border-brand-border bg-[#050505] text-white/50 font-display font-black uppercase tracking-widest text-sm">
            <div className="text-center">Rank</div>
            <div>Contestant</div>
            <div className="text-right">Jury Score</div>
          </div>

          {rest.length > 0 ? (
            rest.map((rank, index) => {
              const contestant = rank.Contestant;

              return (
                <div key={index} className="group relative border-b last:border-b-0 border-brand-border hover:bg-white/5 transition-colors p-4 sm:p-6 flex items-center gap-4 sm:gap-6">
                  
                  {/* Rank */}
                  <div className="w-12 sm:w-16 text-center shrink-0">
                    <div className="text-[9px] font-display font-black uppercase tracking-[0.3em] text-white/20 group-hover:text-latent-gold/60 transition-colors">Rank</div>
                    <div className="text-3xl sm:text-5xl font-mono font-black text-white/10 leading-none group-hover:text-latent-gold transition-colors">
                      {index + 4}
                    </div>
                  </div>
                  
                  {/* Image */}
                  <div className="relative w-16 h-16 sm:w-24 sm:h-24 shrink-0 border border-brand-border bg-[#0A0A0A] overflow-hidden rounded-sm">
                    {contestant.image_url ? (
                      <Image src={contestant.image_url} alt={contestant.name} fill sizes="96px" className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display font-black text-3xl text-white/10">
                        {contestant.name[0]}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight truncate flex items-center gap-3 text-white group-hover:text-latent-gold-light transition-colors">
                      {contestant.name}
                      {rank.controversy_flag && (
                        <span className="shrink-0 text-[10px] sm:text-xs font-display font-black uppercase tracking-widest bg-latent-crimson/20 text-latent-crimson px-2 py-1 border border-latent-crimson/30 rounded-sm">
                          Controversy
                        </span>
                      )}
                    </h2>
                    <div className="text-sm font-mono font-bold text-white/40 truncate mt-1">
                      {contestant.talent_type} • S{rank.Episode?.season_number || "?"}E{rank.Episode?.episode_number || "?"}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <div className="text-4xl sm:text-6xl font-mono font-black text-latent-crimson tracking-tighter drop-shadow-[0_0_10px_rgba(139,30,45,0.3)]">
                      {rank.latent_score.toFixed(1)}
                    </div>
                    <div className="text-xs font-mono font-bold text-white/30 mt-1">{rank.total_votes_raw} votes</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-32 bg-[#111111] text-white/30 font-display font-black uppercase tracking-widest text-2xl">
              {valid.length === 0 ? "No scores yet. Everyone is safe... for now. ⏳🔪" : "That's the whole board. 🏆"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
