import { getServiceSupabase } from "@/lib/supabase";
import Link from "next/link";

export const revalidate = 300; // Cache for 5 minutes

export default async function LeaderboardPage() {
  const supabase = getServiceSupabase();

  // Fetch top users by Latent Points
  const { data: topUsers } = await supabase
    .from("User")
    .select("id, username, latent_points_alltime, latent_points_season, badges, avatar_url")
    .order("latent_points_season", { ascending: false })
    .limit(50);

  // Fetch Oracle Board (top prediction accuracy)
  const { data: oracles } = await supabase
    .from("User")
    .select("id, username, oracle_score, oracle_qualifying_episodes, avatar_url")
    .gte("oracle_qualifying_episodes", 5) // Minimum 5 qualifying episodes
    .order("oracle_score", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen selection:bg-broadcast-red/30">
      
      {/* Full Viewport Hero */}
      <div className="min-h-[60vh] flex flex-col items-center justify-center relative border-b-8 border-brand-black bg-brand-white px-6">
        <div className="text-center space-y-6 z-10">
          <div className="inline-block bg-brand-black text-white px-6 py-2 font-display font-black uppercase tracking-widest mb-4 shadow-[4px_4px_0px_0px_#E53935]">
            The Hierarchy
          </div>
          
          <h1 className="text-7xl sm:text-9xl md:text-[8rem] font-display font-black tracking-tighter uppercase text-brand-black leading-[0.85] drop-shadow-xl">
            THE <span className="text-broadcast-red relative inline-block">
              LEADERBOARDS
              <span className="absolute -bottom-2 sm:-bottom-4 left-0 w-full h-2 sm:h-4 bg-brand-black" />
            </span>
          </h1>
          
          <p className="text-xl sm:text-3xl text-brand-black/70 max-w-3xl mx-auto font-medium mt-8 leading-snug">
            The people who actually know what they're talking about. The rest of you are just making noise. 🏆📉
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 sm:p-12 mt-12 mb-32">
        <div className="grid lg:grid-cols-2 gap-12 sm:gap-24">
          
          {/* Latent Points Leaderboard */}
          <section className="space-y-8">
            <div className="flex justify-between items-end border-b-4 border-brand-black pb-2">
              <h2 className="text-3xl font-display font-black uppercase tracking-widest text-brand-black">Season Rank</h2>
              <span className="text-xs font-display font-black uppercase tracking-widest text-brand-black/50">By Latent Pts</span>
            </div>
            
            <div className="space-y-0 border-4 border-brand-black bg-white shadow-[8px_8px_0px_0px_#0A0A0A]">
              {topUsers?.map((user, idx) => (
                <div key={user.id} className="group relative border-b-4 last:border-b-0 border-brand-black/10 hover:border-brand-black hover:bg-brand-gray/30 transition-colors p-4 flex items-center gap-4">
                  <div className="font-mono font-black text-2xl sm:text-3xl text-brand-black/20 w-10 sm:w-12 text-center group-hover:text-brand-black transition-colors">#{idx + 1}</div>
                  
                  <div className="w-12 h-12 border-2 border-brand-black bg-brand-gray overflow-hidden shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0" alt={user.username} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display font-black text-xl text-brand-black/30 uppercase">
                        {user.username[0]}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-brand-black truncate flex items-center gap-2">
                      {user.username}
                      {user.badges?.includes("Latent Legend") && (
                        <span className="shrink-0 text-[10px] font-display font-black uppercase tracking-widest bg-oracle-gold text-brand-black px-2 py-0.5 border-2 border-brand-black shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]">
                          Legend
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-2xl sm:text-3xl text-broadcast-red tracking-tighter">
                      {user.latent_points_season}
                    </div>
                    <div className="text-[10px] font-display font-black uppercase tracking-widest text-brand-black/40">Points</div>
                  </div>
                </div>
              ))}
              
              {(!topUsers || topUsers.length === 0) && (
                <div className="text-center py-16 bg-brand-gray text-brand-black/50 font-display font-black uppercase tracking-widest text-xl">
                  No users ranked yet.
                </div>
              )}
            </div>
          </section>

          {/* Oracle Board */}
          <section className="space-y-8">
            <div className="flex justify-between items-end border-b-4 border-brand-black pb-2">
              <h2 className="text-3xl font-display font-black uppercase tracking-widest text-brand-black">The Oracle Board</h2>
              <span className="text-xs font-display font-black uppercase tracking-widest text-brand-black/50">Accuracy %</span>
            </div>
            
            <div className="space-y-0 border-4 border-brand-black bg-white shadow-[8px_8px_0px_0px_#0A0A0A]">
              {oracles?.map((user, idx) => (
                <div key={user.id} className="group relative border-b-4 last:border-b-0 border-brand-black/10 hover:border-brand-black hover:bg-brand-gray/30 transition-colors p-4 flex items-center gap-4">
                  <div className="font-mono font-black text-2xl sm:text-3xl text-brand-black/20 w-10 sm:w-12 text-center group-hover:text-brand-black transition-colors">#{idx + 1}</div>
                  
                  <div className="w-12 h-12 border-2 border-brand-black bg-brand-gray overflow-hidden shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0" alt={user.username} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display font-black text-xl text-brand-black/30 uppercase">
                        {user.username[0]}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-brand-black truncate">
                      {user.username}
                    </div>
                    <div className="text-[10px] font-display font-black uppercase tracking-widest text-brand-black/50 truncate mt-0.5">
                      {user.oracle_qualifying_episodes} predictions
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-2xl sm:text-3xl text-oracle-green tracking-tighter">
                      {(user.oracle_score * 100).toFixed(1)}%
                    </div>
                    <div className="text-[10px] font-display font-black uppercase tracking-widest text-brand-black/40">Accuracy</div>
                  </div>
                </div>
              ))}
              
              {(!oracles || oracles.length === 0) && (
                <div className="text-center py-16 bg-brand-gray text-brand-black/50 font-display font-black uppercase tracking-widest text-xl">
                  Board requires 5+ qualifying predictions. Empty.
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
