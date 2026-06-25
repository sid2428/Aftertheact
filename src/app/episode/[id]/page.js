import { getServiceSupabase } from "@/lib/supabase";
import ContestantCard from "@/components/ContestantCard";
import VotingSection from "@/components/VotingSection";
import RevelationSequence, { RevelationItem } from "@/components/RevelationSequence";
import RevealCountdown from "@/components/RevealCountdown";
import { triggerExpiredRevelation } from "@/app/actions/revelation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notFound } from "next/navigation";

export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = getServiceSupabase();
  const { data: episode } = await supabase
    .from("Episode")
    .select("title, season_number, episode_number")
    .eq("id", id)
    .single();

  if (!episode) return { title: "Episode" };
  return {
    title: `S${episode.season_number}E${episode.episode_number} — ${episode.title}`,
    description: `Verdicts and scores for ${episode.title}.`,
  };
}

export default async function EpisodePage({ params }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const supabase = getServiceSupabase();
  
  let { data: episode, error } = await supabase
    .from("Episode")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !episode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 selection:bg-broadcast-red/30">
        <div className="border-4 border-brand-black p-12 text-center shadow-[16px_16px_0px_0px_#0A0A0A] bg-white">
          <div className="text-4xl font-display font-black uppercase text-brand-black">Episode not found.</div>
        </div>
      </div>
    );
  }

  if (episode.status === "LIVE" && episode.voting_window_close) {
    await triggerExpiredRevelation(episode.id);
    const { data: refreshedEpisode } = await supabase
      .from("Episode")
      .select("*")
      .eq("id", id)
      .single();
    if (refreshedEpisode) episode = refreshedEpisode;
  }

  if (episode.status === "ARCHIVED") {
    notFound();
  }

  const { data: appearances } = await supabase
    .from("ContestantEpisodeAppearance")
    .select(`
      *,
      Contestant (*)
    `)
    .eq("episode_id", episode.id);

  const sortedAppearances = appearances?.sort((a, b) => {
    if (episode.status === "REVEALED" || episode.status === "ARCHIVED") {
      return (a.latent_score || 0) - (b.latent_score || 0);
    }
    return a.id.localeCompare(b.id);
  }) || [];

  const isClosed = episode.status === "REVEALED" || episode.status === "ARCHIVED";
  const scored = sortedAppearances.filter((a) => a.latent_score != null);
  const finalAverage = scored.length
    ? scored.reduce((sum, a) => sum + a.latent_score, 0) / scored.length
    : null;
  const totalVotes = sortedAppearances.reduce((sum, a) => sum + (a.total_votes_raw || 0), 0);

  // Fetch the current user's existing votes for this episode so the UI locks them instantly.
  let userVotesMap = {};
  if (session?.user?.id) {
    const { data: existingVotes } = await supabase
      .from("UserVote")
      .select("contestant_id, score")
      .eq("episode_id", episode.id)
      .eq("user_id", session.user.id);
    if (existingVotes) {
      userVotesMap = existingVotes.reduce((acc, v) => ({ ...acc, [v.contestant_id]: v.score }), {});
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-latent-crimson/30">
      
      {/* Episode header — static so it doesn't trail the page while voting */}
      <div className="relative z-30 bg-[#111111]/90 backdrop-blur-md border-b border-brand-border p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-4xl font-display font-black tracking-tight uppercase text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">S{episode.season_number}E{episode.episode_number} — {episode.title}</h1>
              <span className={`px-2 py-1 text-[10px] sm:text-xs font-display font-black uppercase tracking-widest border rounded-sm ${
                episode.status === 'LIVE' ? 'bg-latent-crimson/20 text-latent-crimson border-latent-crimson animate-pulse-fast shadow-[0_0_10px_rgba(139,30,45,0.5)]' :
                episode.status === 'UPCOMING' ? 'bg-[#050505] text-white/50 border-white/20' :
                'bg-latent-gold/20 text-latent-gold border-latent-gold/50'
              }`}>
                {episode.status}
              </span>
            </div>
            <div className="text-sm font-mono font-bold text-white/50">Aired: {new Date(episode.air_date).toLocaleDateString()}</div>
          </div>

          {episode.status === "LIVE" && (
            <div className="flex items-center gap-3 bg-latent-crimson text-white font-display font-black uppercase tracking-widest text-sm px-4 py-2 rounded-sm shadow-[0_0_20px_rgba(139,30,45,0.6)]">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse-fast shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
              LIVE — Cast Your Verdict
            </div>
          )}
        </div>
      </div>

      {/* Mini-hero band */}
      <div className="relative overflow-hidden border-b border-brand-border">
        {episode.thumbnail_url && (
          <img
            src={episode.thumbnail_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "blur(20px) brightness(0.3)" }}
          />
        )}
        <div className="relative bg-gradient-to-r from-[#0A0A0A] via-[#111111]/60 to-[#0A0A0A]">
          <div className="max-w-7xl mx-auto min-h-[90px] px-4 sm:px-6 lg:px-12 py-4 flex items-center justify-between gap-4">
            <div className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-white/50 shrink-0 w-[30%]">
              {episode.status === "LIVE" && episode.voting_window_close ? (
                <RevealCountdown key={episode.voting_window_close} revealAt={episode.voting_window_close} />
              ) : (
                <>
                  <div>Season {episode.season_number}</div>
                  <div>Episode {episode.episode_number}</div>
                  <div className="text-white/30">{new Date(episode.air_date).toLocaleDateString()}</div>
                </>
              )}
            </div>

            <div className="flex-1 text-center font-display font-black uppercase tracking-tight text-white text-lg sm:text-2xl lg:text-3xl truncate">
              {episode.title}
            </div>

            <div className="shrink-0 w-[30%] flex justify-end">
              {episode.status === "LIVE" ? (
                <div className="flex items-center gap-2 bg-latent-crimson/20 border border-latent-crimson/50 text-latent-crimson font-display font-black uppercase tracking-widest text-[10px] sm:text-xs px-3 py-2 rounded-sm animate-pulse-fast">
                  <span className="w-2 h-2 rounded-full bg-latent-crimson" />
                  Voting Open
                </div>
              ) : isClosed && finalAverage != null ? (
                <div className="text-right">
                  <div className="font-mono font-black text-2xl sm:text-3xl text-latent-gold leading-none">{finalAverage.toFixed(1)}</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-white/40">{totalVotes} votes</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-12 space-y-12">

        {episode.admin_note && (
          <div className="bg-[#111111] text-white p-6 border border-latent-crimson/30 rounded-md shadow-[0_0_20px_rgba(139,30,45,0.2)] font-mono font-bold relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-latent-crimson" />
            <span className="text-latent-crimson block mb-2 uppercase tracking-widest text-xs font-display">System Broadcast:</span>
            {episode.admin_note}
          </div>
        )}

        {/* Prediction Banner for Upcoming */}
        {episode.status === "UPCOMING" && (
          <div className="bg-[#111111] border border-latent-gold/30 rounded-md p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(212,175,55,0.15)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-latent-gold/5 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl font-display font-black uppercase tracking-widest text-latent-gold mb-2 drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">The Oracle Board is open</h2>
              <p className="text-white/70 font-medium">Lock in your predictions for Top, Bottom, and Alignment before air time. Once it starts, your calls are permanent.</p>
            </div>
            <button className="shrink-0 relative z-10 bg-gradient-to-r from-latent-gold to-[#B8860B] text-[#0A0A0A] hover:shadow-[0_0_20px_rgba(212,175,55,0.5)] border border-transparent rounded-sm px-8 py-4 font-display font-black uppercase tracking-widest transition-all">
              Make Predictions
            </button>
          </div>
        )}

        <div className="space-y-8">
          <h2 className="text-4xl font-display font-black tracking-tighter uppercase text-white border-b border-white/10 pb-2">
            The Lineup
          </h2>
          
          {episode.status === "LIVE" ? (
            <div className="relative">
              {/* Live heartbeat behind the voting cards */}
              <div className="episode-pulse pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2" />
              <div className="relative">
                <VotingSection
                  episodeId={episode.id}
                  revealAt={episode.voting_window_close ?? null}
                  contestants={sortedAppearances.map((app) => ({
                    id: app.Contestant.id,
                    name: app.Contestant.name,
                    talent_type: app.Contestant.talent_type,
                    image_url: app.Contestant.image_url,
                    userVoteScore: userVotesMap[app.Contestant.id] ?? null,
                  }))}
                />
              </div>
            </div>
          ) : (
            <RevelationSequence isRevealed={episode.status === "REVEALED" || episode.status === "ARCHIVED"}>
              {sortedAppearances.map((app) => (
                <RevelationItem key={app.id}>
                  <ContestantCard
                    contestant={app.Contestant}
                    appearance={app}
                    episodeStatus={episode.status}
                  />
                </RevelationItem>
              ))}
            </RevelationSequence>
          )}

          {sortedAppearances.length === 0 && (
            <div className="text-center py-24 bg-[#050505] text-white/30 font-display font-black uppercase tracking-widest text-2xl border border-white/10 border-dashed rounded-md">
              No contestants have been added to this episode yet.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
