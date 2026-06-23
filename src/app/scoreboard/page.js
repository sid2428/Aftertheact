import { getServiceSupabase } from "@/lib/supabase";
import { ScoreboardHero } from "@/components/ScoreboardHero";

export const revalidate = 60; // ISR cache 60 seconds

export default async function CommunityScoreboard() {
  const supabase = getServiceSupabase();
  
  const { data: rankings } = await supabase
    .from("ContestantEpisodeAppearance")
    .select(`
      latent_score,
      total_votes_raw,
      controversy_flag,
      Contestant (
        name, slug, talent_type, image_url, is_removed_by_request
      ),
      Episode (
        season_number, episode_number
      )
    `)
    .not("latent_score", "is", null)
    .order("latent_score", { ascending: true });

  return (
    <div className="min-h-screen bg-[#0A0A0A] selection:bg-latent-crimson/30">
      
      {/* Full Viewport Hero */}
      <ScoreboardHero />

      {/* The Scoreboard Table - Scrolled down */}
      <div className="max-w-6xl mx-auto p-6 sm:p-12 mt-12 sm:mt-24 mb-32 relative z-20">
        <div className="space-y-0 rounded-md overflow-hidden border border-brand-border bg-[#111111] shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          <div className="hidden sm:grid grid-cols-[80px_1fr_120px] gap-6 p-4 border-b border-brand-border bg-[#050505] text-white/50 font-display font-black uppercase tracking-widest text-sm">
            <div className="text-center">Rank</div>
            <div>Contestant</div>
            <div className="text-right">Latent Score</div>
          </div>

          {rankings && rankings.length > 0 ? (
            rankings.map((rank, index) => {
              const contestant = rank.Contestant;
              if (!contestant || contestant.is_removed_by_request) return null;

              return (
                <div key={index} className="group relative border-b last:border-b-0 border-brand-border hover:bg-white/5 transition-colors p-4 sm:p-6 flex items-center gap-4 sm:gap-6">
                  
                  {/* Rank */}
                  <div className="text-3xl sm:text-5xl font-mono font-black text-white/10 w-12 sm:w-16 text-center group-hover:text-latent-gold transition-colors">
                    #{index + 1}
                  </div>
                  
                  {/* Image */}
                  <div className="relative w-16 h-16 sm:w-24 sm:h-24 shrink-0 border border-brand-border bg-[#0A0A0A] overflow-hidden rounded-sm">
                    {contestant.image_url ? (
                      <img src={contestant.image_url} alt={contestant.name} className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500" />
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
              No scores yet. Everyone is safe... for now. ⏳🔪
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
