import { getServiceSupabase } from "@/lib/supabase";
import { ScoreboardHero } from "@/components/ScoreboardHero";
import LiveScoreboard from "@/components/LiveScoreboard";
import ScoreboardPodium from "@/components/ScoreboardPodium";

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

  const valid = (rankings || []).filter((r) => r.Contestant && !r.Contestant.is_removed_by_request);
  const podium = valid.slice(0, 3).map((r) => ({
    id: r.id,
    name: r.Contestant.name,
    imageUrl: r.Contestant.image_url,
    score: r.latent_score,
  }));

  return (
    <div className="min-h-screen bg-[#0A0A0A] selection:bg-latent-crimson/30">

      {/* Full Viewport Hero */}
      <ScoreboardHero topThree={valid.map((e) => ({ name: e.Contestant.name, image_url: e.Contestant.image_url }))} />

      {/* The animated FLIP leaderboard */}
      <div className="max-w-6xl mx-auto p-6 sm:p-12 mt-12 sm:mt-16 mb-16 relative z-20">
        {valid.length > 0 ? (
          <div className="glass-surface rounded-[2rem] p-3 sm:p-5">
            <LiveScoreboard
              rows={valid.map((r) => ({
                id: r.id,
                name: r.Contestant.name,
                talentType: r.Contestant.talent_type,
                imageUrl: r.Contestant.image_url,
                score: r.latent_score,
                votes: r.total_votes_raw,
                controversy: r.controversy_flag,
                episodeLabel: `S${r.Episode?.season_number || "?"}E${r.Episode?.episode_number || "?"}`,
              }))}
              startRank={1}
              revealOnMount
              ariaLabel="Community verdict leaderboard"
            />
          </div>
        ) : (
          <div className="glass-surface text-center py-32 rounded-[2rem] text-white/30 font-display uppercase tracking-widest text-2xl">
            {valid.length === 0 ? "No scores yet. Everyone is safe... for now. ⏳🔪" : "That's the whole board. 🏆"}
          </div>
        )}
      </div>

      {/* Podium - Top 3 beneath the scoreboard */}
      <ScoreboardPodium podium={podium} />
    </div>
  );
}
