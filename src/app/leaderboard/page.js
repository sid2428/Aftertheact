import { getServiceSupabase } from "@/lib/supabase";

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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans p-6 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-16">
        
        <header className="text-center space-y-4">
          <h1 className="text-5xl font-black tracking-tighter text-rose-500">THE LEADERBOARDS</h1>
          <p className="text-neutral-400 max-w-xl mx-auto">
            The people who actually know what they're talking about.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-12">
          
          {/* Latent Points Leaderboard */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-widest text-white border-b border-neutral-800 pb-2">Season Rank</h2>
            <div className="space-y-3">
              {topUsers?.map((user, idx) => (
                <div key={user.id} className="flex items-center gap-4 p-3 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-600 transition-colors">
                  <div className="font-black text-xl text-neutral-600 w-6">{idx + 1}</div>
                  <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden shrink-0 border border-neutral-700">
                    {user.avatar_url ? <img src={user.avatar_url} /> : <div className="w-full h-full flex items-center justify-center font-bold text-neutral-500">{user.username[0]}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate">{user.username}</div>
                    <div className="text-xs text-neutral-500 truncate mt-0.5">
                      {user.badges?.includes("Latent Legend") && <span className="text-rose-500 font-bold uppercase tracking-widest">Legend</span>}
                    </div>
                  </div>
                  <div className="font-black text-rose-500 shrink-0">{user.latent_points_season} <span className="text-xs text-neutral-500 font-normal">pts</span></div>
                </div>
              ))}
            </div>
          </section>

          {/* Oracle Board */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-widest text-white border-b border-neutral-800 pb-2">The Oracle Board</h2>
            <div className="space-y-3">
              {oracles?.map((user, idx) => (
                <div key={user.id} className="flex items-center gap-4 p-3 bg-gradient-to-r from-neutral-900 to-neutral-950 border border-neutral-800 rounded-xl hover:border-neutral-600 transition-colors">
                  <div className="font-black text-xl text-neutral-600 w-6">{idx + 1}</div>
                  <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden shrink-0 border border-neutral-700">
                    {user.avatar_url ? <img src={user.avatar_url} /> : <div className="w-full h-full flex items-center justify-center font-bold text-neutral-500">{user.username[0]}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate">{user.username}</div>
                    <div className="text-xs text-neutral-500 truncate mt-0.5">{user.oracle_qualifying_episodes} predictions</div>
                  </div>
                  <div className="font-black text-rose-500 shrink-0">{(user.oracle_score * 100).toFixed(1)}%</div>
                </div>
              ))}
              
              {(!oracles || oracles.length === 0) && (
                <div className="text-center py-8 text-neutral-600 italic border border-dashed border-neutral-800 rounded-xl">
                  Oracle Board requires 5+ qualifying episodes. It is currently empty.
                </div>
              )}
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
