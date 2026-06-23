import { getServiceSupabase } from "@/lib/supabase";
import ContestantCard from "@/components/ContestantCard";
import RevelationSequence, { RevelationItem } from "@/components/RevelationSequence";

export const revalidate = 60; // ISR cache 60 seconds

export default async function EpisodePage({ params }) {
  const supabase = getServiceSupabase();
  
  const { data: episode, error } = await supabase
    .from("Episode")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !episode) {
    return <div className="p-12 text-center text-red-500 font-bold">Episode not found.</div>;
  }

  const { data: appearances } = await supabase
    .from("ContestantEpisodeAppearance")
    .select(`
      *,
      Contestant (*)
    `)
    .eq("episode_id", episode.id);

  // Sort logic based on status
  // If revealed, sort by latent_score ascending (worst first)
  // Else sort by created_at or ID
  const sortedAppearances = appearances?.sort((a, b) => {
    if (episode.status === "REVEALED" || episode.status === "ARCHIVED") {
      return (a.latent_score || 0) - (b.latent_score || 0);
    }
    return a.id.localeCompare(b.id);
  }) || [];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-rose-500/30">
      
      {/* Sticky Episode Header */}
      <div className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl sm:text-2xl font-black">S{episode.season_number}E{episode.episode_number} — {episode.title}</h1>
              <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded border ${
                episode.status === 'LIVE' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                episode.status === 'UPCOMING' ? 'bg-neutral-800 text-neutral-400 border-neutral-700' :
                'bg-rose-500/10 text-rose-500 border-rose-500/20'
              }`}>
                {episode.status}
              </span>
            </div>
            <div className="text-sm text-neutral-500">Aired: {new Date(episode.air_date).toLocaleDateString()}</div>
          </div>
          
          {episode.status === "LIVE" && (
            <div className="flex items-center gap-2 text-rose-500 font-bold text-sm bg-rose-500/10 px-4 py-2 rounded-lg border border-rose-500/20">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              Voting Window Open
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-8 mt-4">
        
        {episode.admin_note && (
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl text-neutral-300 italic">
            "{episode.admin_note}"
          </div>
        )}

        {/* Prediction Banner for Upcoming */}
        {episode.status === "UPCOMING" && (
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 p-6 sm:p-8 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold mb-2">The Oracle Board is open</h2>
              <p className="text-neutral-400 text-sm">Lock in your predictions for Top, Bottom, and Alignment before air time. Once it starts, your calls are permanent.</p>
            </div>
            <button className="shrink-0 bg-white text-black hover:bg-neutral-200 px-6 py-3 rounded-lg font-bold transition-colors">
              Make Predictions
            </button>
          </div>
        )}

        <div className="space-y-6">
          <h2 className="text-lg font-black tracking-widest text-neutral-500 uppercase">The Lineup</h2>
          
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

          {sortedAppearances.length === 0 && (
            <div className="text-center py-12 text-neutral-600 italic border border-dashed border-neutral-800 rounded-2xl">
              No contestants have been added to this episode yet.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
