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
    <div className="min-h-screen bg-[#0A0A0A] selection:bg-latent-crimson/30">
      
      {/* Full Viewport Hero */}
      <div className="min-h-[60vh] flex flex-col items-center justify-center relative overflow-hidden px-6">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-latent-gold/5 via-[#0A0A0A]/80 to-[#0A0A0A] pointer-events-none" />
        
        <div className="text-center space-y-6 z-10">
          <div className="inline-block bg-[#111111] text-white/70 border border-white/10 px-6 py-2 font-display font-black uppercase tracking-widest mb-4 shadow-[0_0_15px_rgba(255,255,255,0.05)] rounded-sm">
            The Hierarchy
          </div>
          
          <h1 className="text-7xl sm:text-9xl md:text-[8rem] font-display font-black tracking-tighter uppercase text-white leading-[0.85] drop-shadow-2xl">
            THE <span className="text-latent-gold relative inline-block drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              LEADERBOARDS
              <span className="absolute -bottom-2 sm:-bottom-4 left-0 w-full h-2 sm:h-4 bg-latent-gold" />
            </span>
          </h1>
          
          <p className="text-xl sm:text-3xl text-white/70 max-w-3xl mx-auto font-medium mt-8 leading-snug">
            The people who actually know what they're talking about. The rest of you are just making noise. 🏆📉
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 sm:p-12 mt-12 mb-32 relative z-20">
        <div className="grid lg:grid-cols-2 gap-12 sm:gap-24">
          
          {/* Latent Points Leaderboard */}
          <section className="space-y-8">
            <div className="flex justify-between items-end border-b border-brand-border pb-2">
              <h2 className="text-3xl font-display font-black uppercase tracking-widest text-white">Season Rank</h2>
              <span className="text-xs font-display font-black uppercase tracking-widest text-white/50">By Latent Pts</span>
            </div>
            
            <div className="space-y-0 rounded-md overflow-hidden border border-brand-border bg-[#111111] shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              {topUsers?.map((user, idx) => (
                <div key={user.id} className="group relative border-b last:border-b-0 border-brand-border hover:bg-white/5 transition-colors p-4 flex items-center gap-4">
                  <div className="font-mono font-black text-2xl sm:text-3xl text-white/10 w-10 sm:w-12 text-center group-hover:text-latent-gold transition-colors">#{idx + 1}</div>
                  
                  <div className="w-12 h-12 border border-brand-border bg-[#0A0A0A] overflow-hidden shrink-0 rounded-sm">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={user.username} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display font-black text-xl text-white/10 uppercase">
                        {user.username[0]}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-white group-hover:text-latent-gold-light transition-colors truncate flex items-center gap-2">
                      {user.username}
                      {user.badges?.includes("Latent Legend") && (
                        <span className="shrink-0 text-[10px] font-display font-black uppercase tracking-widest bg-latent-gold/20 text-latent-gold px-2 py-0.5 border border-latent-gold/30 rounded-sm">
                          Legend
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-2xl sm:text-3xl text-latent-gold tracking-tighter drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">
                      {user.latent_points_season}
                    </div>
                    <div className="text-[10px] font-display font-black uppercase tracking-widest text-white/40">Points</div>
                  </div>
                </div>
              ))}
              
              {(!topUsers || topUsers.length === 0) && (
                <div className="text-center py-16 bg-[#111111] text-white/30 font-display font-black uppercase tracking-widest text-xl">
                  No users ranked yet.
                </div>
              )}
            </div>
          </section>

          {/* Oracle Board */}
          <section className="space-y-8">
            <div className="flex justify-between items-end border-b border-brand-border pb-2">
              <h2 className="text-3xl font-display font-black uppercase tracking-widest text-white">The Oracle Board</h2>
              <span className="text-xs font-display font-black uppercase tracking-widest text-white/50">Accuracy %</span>
            </div>
            
            <div className="space-y-0 rounded-md overflow-hidden border border-brand-border bg-[#111111] shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              {oracles?.map((user, idx) => (
                <div key={user.id} className="group relative border-b last:border-b-0 border-brand-border hover:bg-white/5 transition-colors p-4 flex items-center gap-4">
                  <div className="font-mono font-black text-2xl sm:text-3xl text-white/10 w-10 sm:w-12 text-center group-hover:text-oracle-green transition-colors">#{idx + 1}</div>
                  
                  <div className="w-12 h-12 border border-brand-border bg-[#0A0A0A] overflow-hidden shrink-0 rounded-sm">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={user.username} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display font-black text-xl text-white/10 uppercase">
                        {user.username[0]}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-white group-hover:text-oracle-green transition-colors truncate">
                      {user.username}
                    </div>
                    <div className="text-[10px] font-display font-black uppercase tracking-widest text-white/50 truncate mt-0.5">
                      {user.oracle_qualifying_episodes} predictions
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-2xl sm:text-3xl text-oracle-green tracking-tighter drop-shadow-[0_0_10px_rgba(76,175,80,0.3)]">
                      {(user.oracle_score * 100).toFixed(1)}%
                    </div>
                    <div className="text-[10px] font-display font-black uppercase tracking-widest text-white/40">Accuracy</div>
                  </div>
                </div>
              ))}
              
              {(!oracles || oracles.length === 0) && (
                <div className="text-center py-16 bg-[#111111] text-white/30 font-display font-black uppercase tracking-widest text-xl">
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
