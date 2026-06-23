import { getServiceSupabase } from "@/lib/supabase";
import ContestantCard from "@/components/ContestantCard";
import RevelationSequence, { RevelationItem } from "@/components/RevelationSequence";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const revalidate = 60; // ISR cache 60 seconds

export default async function EpisodePage({ params }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const supabase = getServiceSupabase();
  
  const { data: episode, error } = await supabase
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

  return (
    <div className="min-h-screen bg-brand-white text-brand-black selection:bg-broadcast-red/30">
      
      {/* Sticky Brutalist Header */}
      <div className="sticky top-16 z-40 bg-white border-b-4 border-brand-black p-4 sm:p-6 shadow-[0px_4px_0px_0px_#0A0A0A]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-4xl font-display font-black tracking-tight uppercase">S{episode.season_number}E{episode.episode_number} — {episode.title}</h1>
              <span className={`px-2 py-1 text-[10px] sm:text-xs font-display font-black uppercase tracking-widest border-2 ${
                episode.status === 'LIVE' ? 'bg-broadcast-red text-white border-broadcast-red animate-pulse-fast' : 
                episode.status === 'UPCOMING' ? 'bg-brand-gray text-brand-black/50 border-brand-black/20' :
                'bg-brand-black text-white border-brand-black'
              }`}>
                {episode.status}
              </span>
            </div>
            <div className="text-sm font-mono font-bold text-brand-black/50">Aired: {new Date(episode.air_date).toLocaleDateString()}</div>
          </div>
          
          {episode.status === "LIVE" && (
            <div className="flex items-center gap-3 bg-broadcast-red text-white font-display font-black uppercase tracking-widest text-sm px-4 py-2 border-2 border-brand-black shadow-[4px_4px_0px_0px_#0A0A0A]">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse-fast"></span>
              Voting Window Open
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-12 space-y-12">
        
        {episode.admin_note && (
          <div className="bg-brand-black text-white p-6 border-4 border-brand-black shadow-[8px_8px_0px_0px_#E53935] font-mono font-bold">
            <span className="text-broadcast-red block mb-2 uppercase tracking-widest text-xs font-display">System Broadcast:</span>
            {episode.admin_note}
          </div>
        )}

        {/* Prediction Banner for Upcoming */}
        {episode.status === "UPCOMING" && (
          <div className="bg-white border-4 border-brand-black p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[12px_12px_0px_0px_#0A0A0A]">
            <div>
              <h2 className="text-3xl font-display font-black uppercase tracking-widest text-brand-black mb-2">The Oracle Board is open</h2>
              <p className="text-brand-black/70 font-medium">Lock in your predictions for Top, Bottom, and Alignment before air time. Once it starts, your calls are permanent.</p>
            </div>
            <button className="shrink-0 bg-brand-black text-white hover:bg-broadcast-red hover:text-white border-4 border-brand-black px-8 py-4 font-display font-black uppercase tracking-widest transition-colors shadow-[4px_4px_0px_0px_#0A0A0A]">
              Make Predictions
            </button>
          </div>
        )}

        <div className="space-y-8">
          <h2 className="text-4xl font-display font-black tracking-tighter uppercase text-brand-black border-b-4 border-brand-black pb-2">
            The Lineup
          </h2>
          
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
            <div className="text-center py-24 bg-brand-gray text-brand-black/50 font-display font-black uppercase tracking-widest text-2xl border-4 border-brand-black/10 border-dashed">
              No contestants have been added to this episode yet.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
