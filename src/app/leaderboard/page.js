import { getServiceSupabase } from "@/lib/supabase";
import Image from "next/image";
import LeaderboardHero from "@/components/LeaderboardHero";
import RollingNumber from "@/components/RollingNumber";
import { Crown } from "lucide-react";

export const metadata = {
  title: "Prophet's Wall | Oracle Accuracy and Season Standings",
  description: "The sharpest predictors and the highest-ranked jurors of the season.",
};

export const revalidate = 30; // Revalidate every 30s so new reveals appear promptly

export default async function LeaderboardPage() {
  const supabase = getServiceSupabase();

  // Fetch top users by Latent Points
  const { data: topUsers } = await supabase
    .from("User")
    .select("id, username, latent_points_alltime, latent_points_season, badges, avatar_url")
    .order("latent_points_season", { ascending: false })
    .limit(50);

  // Fetch Oracle Board (top prediction accuracy). Show anyone with at least one
  // qualifying prediction so the board isn't empty early in a season.
  const { data: oracles } = await supabase
    .from("User")
    .select("id, username, oracle_score, oracle_qualifying_episodes, avatar_url, badges")
    .gte("oracle_qualifying_episodes", 1)
    .order("oracle_score", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-[#0A0A0A] selection:bg-latent-crimson/30">
      
      {/* Full Viewport Hero */}
      <LeaderboardHero topUsers={topUsers?.slice(0, 3) || []} />

      <div className="max-w-7xl mx-auto p-6 sm:p-12 mt-12 mb-32 relative z-20">
        <div className="grid gap-10 lg:grid-cols-2">
          
          {/* Latent Points Leaderboard */}
          <section className="space-y-8">
            <div className="flex items-end justify-between border-b border-brand-border pb-3">
              <h2 className="text-3xl font-display font-black uppercase tracking-widest text-white">Season Standing</h2>
              <span className="text-xs font-display font-black uppercase tracking-widest text-white/50">By Latent Pts</span>
            </div>
            
            <div className="glass-surface space-y-2 overflow-hidden rounded-[2rem] p-3">
              {topUsers?.map((user, idx) => (
                <div key={user.id} className={`glass-row group relative flex items-center gap-4 rounded-2xl border p-4 transition-colors ${idx === 0 ? "border-latent-gold/35 bg-latent-gold/[0.06]" : "border-white/10"}`}>
                  <div className="w-10 text-center font-number text-2xl font-black text-white/15 transition-colors group-hover:text-latent-gold sm:w-12 sm:text-3xl">#{idx + 1}</div>
                  
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-brand-border bg-[#0A0A0A]">
                    {user.avatar_url ? (
                      <Image src={user.avatar_url} alt={user.username} fill sizes="48px" className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display font-black text-xl text-white/10 uppercase">
                        {user.username[0]}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 truncate font-display text-xl font-black uppercase tracking-tight text-white transition-colors group-hover:text-latent-gold-light sm:text-2xl">
                      {user.username}
                      {(user.badges || []).map(badge => (
                        <span key={badge} className="shrink-0 rounded-full border border-latent-gold/30 bg-latent-gold/20 px-2 py-0.5 font-display text-[10px] font-black uppercase tracking-widest text-latent-gold">
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <RollingNumber value={user.latent_points_season || 0} decimals={0} height={30} className="justify-end font-bold text-latent-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]" />
                    <div className="text-[10px] font-display font-black uppercase tracking-widest text-white/40">Points</div>
                  </div>
                </div>
              ))}
              
              {(!topUsers || topUsers.length === 0) && (
                <div className="glass-row rounded-2xl border border-dashed border-white/10 py-16 text-center font-display text-xl font-black uppercase tracking-widest text-white/35">
                  No users ranked yet.
                </div>
              )}
            </div>
          </section>

          {/* Oracle Board */}
          <section className="space-y-8">
            <div className="flex items-end justify-between border-b border-brand-border pb-3">
              <h2 className="text-3xl font-display font-black uppercase tracking-widest text-white">Prophet&apos;s Wall</h2>
              <span className="text-xs font-display font-black uppercase tracking-widest text-white/50">Oracle System</span>
            </div>
            
            <div className="glass-surface space-y-2 overflow-hidden rounded-[2rem] p-3">
              {oracles?.map((user, idx) => (
                <div key={user.id} className={`glass-row group relative flex items-center gap-4 rounded-2xl border p-4 transition-colors ${idx === 0 ? "border-latent-gold/40 bg-latent-gold/[0.06] shadow-[0_0_32px_rgba(212,175,55,0.18)]" : "border-white/10"}`}>
                  <div className="w-10 text-center font-number text-2xl font-black text-white/15 transition-colors group-hover:text-oracle-green sm:w-12 sm:text-3xl">#{idx + 1}</div>
                  
                  <div className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-full border bg-[#0A0A0A] ${idx === 0 ? "border-latent-gold shadow-[0_0_18px_rgba(212,175,55,0.42)]" : "border-brand-border"}`}>
                    {idx === 0 && <Crown className="absolute right-0 top-0 z-10 h-4 w-4 text-latent-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]" strokeWidth={2.5} />}
                    {user.avatar_url ? (
                      <Image src={user.avatar_url} alt={user.username} fill sizes="48px" className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display font-black text-xl text-white/10 uppercase">
                        {user.username[0]}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center flex-wrap gap-2 truncate font-display text-xl font-black uppercase tracking-tight transition-colors sm:text-2xl ${idx === 0 ? "text-latent-gold" : "text-white group-hover:text-oracle-green"}`}>
                      {user.username}
                      {(user.badges || []).map(badge => (
                        <span key={badge} className="shrink-0 rounded-full border border-latent-gold/30 bg-latent-gold/20 px-2 py-0.5 font-display text-[10px] font-black uppercase tracking-widest text-latent-gold">
                          {badge}
                        </span>
                      ))}
                    </div>
                    <div className="text-[10px] font-display font-black uppercase tracking-widest text-white/50 truncate mt-0.5">
                      {user.oracle_qualifying_episodes} predictions
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <div className="flex items-baseline justify-end">
                      <RollingNumber value={(user.oracle_score || 0) * 100} decimals={1} height={30} className="justify-end font-bold text-oracle-green drop-shadow-[0_0_10px_rgba(76,175,80,0.3)]" />
                      <span className="font-number text-2xl font-bold text-oracle-green">%</span>
                    </div>
                    <div className="text-[10px] font-display font-black uppercase tracking-widest text-white/40">Accuracy</div>
                  </div>
                </div>
              ))}
              
              {(!oracles || oracles.length === 0) && (
                <div className="glass-row rounded-2xl border border-dashed border-oracle-green/25 py-16 px-6 text-center font-display text-xl font-black uppercase tracking-widest text-white/40">
                  No predictions scored yet. Lock your calls before air time.
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
