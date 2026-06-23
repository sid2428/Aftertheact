import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default async function MyProfile() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const supabase = getServiceSupabase();
  const { data: userProfile } = await supabase
    .from("User")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (!userProfile) {
    return <div className="p-12 text-center font-display font-black text-xl">User record not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-12 space-y-12">
      
      {/* Character Sheet Header */}
      <div className="bg-[#111111] border border-brand-border p-8 relative rounded-md shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 bg-[#0A0A0A] border-b border-l border-brand-border text-white/50 px-4 py-1 font-display font-black uppercase tracking-widest text-sm rounded-tr-md rounded-bl-md">
          Character Sheet
        </div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 pt-4">
          <div className="w-32 h-32 rounded-md border border-brand-border bg-[#0A0A0A] overflow-hidden shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            {userProfile.avatar_url ? (
              <img src={userProfile.avatar_url} alt="Avatar" className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-display font-black text-6xl text-white/10">
                {userProfile.username[0]}
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="text-sm font-mono font-bold text-white/30 mb-1">ID: {userProfile.id.split('-')[0]}</div>
            <h1 className="text-4xl md:text-6xl font-display font-black uppercase tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
              {userProfile.username}
            </h1>
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
              {userProfile.badges && userProfile.badges.length > 0 ? (
                userProfile.badges.map(badge => (
                  <span key={badge} className="bg-latent-gold/10 text-latent-gold border border-latent-gold/30 font-display font-black uppercase tracking-widest text-xs px-3 py-1 rounded-sm shadow-[0_0_10px_rgba(212,175,55,0.1)]">
                    {badge}
                  </span>
                ))
              ) : (
                <span className="bg-[#050505] text-white/40 border border-white/10 font-display font-black uppercase tracking-widest text-xs px-3 py-1 rounded-sm">
                  Unranked
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Oracle Score */}
        <div className="bg-[#111111] text-white border border-brand-border p-6 rounded-md shadow-[0_0_20px_rgba(0,0,0,0.4)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-latent-gold/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="text-sm font-display font-bold uppercase tracking-widest text-latent-gold/70 mb-4 border-b border-white/10 pb-2">
              The Oracle Score
            </div>
            <div className="flex justify-between items-end">
              <div className="text-6xl font-mono font-black text-latent-gold leading-none drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                {(userProfile.oracle_score * 100).toFixed(1)}<span className="text-2xl text-latent-gold/50">%</span>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-white/70">{userProfile.oracle_qualifying_episodes}</div>
                <div className="text-xs font-display font-bold uppercase tracking-widest text-white/40">Episodes</div>
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-white/50">
              Measures your ability to correctly predict the Top, Bottom, and Alignment before the episode airs.
            </p>
          </div>
        </div>

        {/* Latent Points */}
        <div className="bg-[#111111] text-white border border-brand-border p-6 rounded-md shadow-[0_0_20px_rgba(0,0,0,0.4)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-latent-crimson/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="text-sm font-display font-bold uppercase tracking-widest text-white/50 mb-4 border-b border-white/10 pb-2">
              Latent Points
            </div>
            <div className="flex justify-between items-end">
              <div className="text-6xl font-mono font-black text-white leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                {userProfile.latent_points_season}
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-white/50">{userProfile.latent_points_alltime}</div>
                <div className="text-xs font-display font-bold uppercase tracking-widest text-white/30">All-Time</div>
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-white/50">
              Earned by locking in correct predictions and having your roasts upvoted by the community.
            </p>
          </div>
        </div>

      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#050505] border border-brand-border p-4 text-center rounded-md">
          <div className="text-[10px] font-display font-black uppercase tracking-widest text-white/40 mb-1">Voting Persona</div>
          <div className="text-lg font-display font-black uppercase text-white/90">{userProfile.voting_personality || "Neutral"}</div>
        </div>
        <div className="bg-[#050505] border border-brand-border p-4 text-center rounded-md">
          <div className="text-[10px] font-display font-black uppercase tracking-widest text-white/40 mb-1">Roast Crowns</div>
          <div className="text-2xl font-mono font-black text-latent-gold">{userProfile.roast_crowns}</div>
        </div>
        <div className="bg-[#050505] border border-brand-border p-4 text-center rounded-md">
          <div className="text-[10px] font-display font-black uppercase tracking-widest text-white/40 mb-1">Avg Vote Delta</div>
          <div className="text-2xl font-mono font-black text-white">{userProfile.average_vote_delta?.toFixed(1) || "0.0"}</div>
        </div>
        <div className="bg-[#050505] border border-brand-border p-4 text-center rounded-md">
          <div className="text-[10px] font-display font-black uppercase tracking-widest text-white/40 mb-1">Trust Score</div>
          <div className="text-2xl font-mono font-black text-[#4CAF50]">{userProfile.trust_score?.toFixed(2)}</div>
        </div>
      </div>
      
    </div>
  );
}
