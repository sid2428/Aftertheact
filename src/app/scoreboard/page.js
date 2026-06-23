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
    <div className="min-h-screen selection:bg-broadcast-red/30">
      
      {/* Full Viewport Hero */}
      <ScoreboardHero />

      {/* The Scoreboard Table - Scrolled down */}
      <div className="max-w-6xl mx-auto p-6 sm:p-12 mt-12 sm:mt-24 mb-32">
        <div className="space-y-0 border-4 border-brand-black bg-white shadow-[16px_16px_0px_0px_#0A0A0A]">
          <div className="hidden sm:grid grid-cols-[80px_1fr_120px] gap-6 p-4 border-b-4 border-brand-black bg-brand-black text-white font-display font-black uppercase tracking-widest text-sm">
            <div className="text-center">Rank</div>
            <div>Contestant</div>
            <div className="text-right">Latent Score</div>
          </div>

          {rankings && rankings.length > 0 ? (
            rankings.map((rank, index) => {
              const contestant = rank.Contestant;
              if (!contestant || contestant.is_removed_by_request) return null;

              return (
                <div key={index} className="group relative border-b-4 last:border-b-0 border-brand-black/10 hover:border-brand-black hover:bg-brand-gray/30 transition-colors p-4 sm:p-6 flex items-center gap-4 sm:gap-6">
                  
                  {/* Rank */}
                  <div className="text-3xl sm:text-5xl font-mono font-black text-brand-black/20 w-12 sm:w-16 text-center group-hover:text-brand-black transition-colors">
                    #{index + 1}
                  </div>
                  
                  {/* Image */}
                  <div className="relative w-16 h-16 sm:w-24 sm:h-24 shrink-0 border-4 border-brand-black bg-brand-gray overflow-hidden">
                    {contestant.image_url ? (
                      <img src={contestant.image_url} alt={contestant.name} className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display font-black text-3xl text-brand-black/30">
                        {contestant.name[0]}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight truncate flex items-center gap-3">
                      {contestant.name}
                      {rank.controversy_flag && (
                        <span className="shrink-0 text-[10px] sm:text-xs font-display font-black uppercase tracking-widest bg-controversy-orange text-white px-2 py-1 border-2 border-brand-black shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]">
                          Controversy
                        </span>
                      )}
                    </h2>
                    <div className="text-sm font-mono font-bold text-brand-black/50 truncate mt-1">
                      {contestant.talent_type} • S{rank.Episode?.season_number || "?"}E{rank.Episode?.episode_number || "?"}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <div className="text-4xl sm:text-6xl font-mono font-black text-broadcast-red tracking-tighter">
                      {rank.latent_score.toFixed(1)}
                    </div>
                    <div className="text-xs font-mono font-bold text-brand-black/40 mt-1">{rank.total_votes_raw} votes</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-32 bg-brand-gray text-brand-black/50 font-display font-black uppercase tracking-widest text-2xl">
              No scores yet. Everyone is safe... for now. ⏳🔪
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
