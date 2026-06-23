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
      <div className="bg-white border-4 border-brand-black p-8 relative">
        <div className="absolute top-0 right-0 bg-brand-black text-white px-4 py-1 font-display font-black uppercase tracking-widest text-sm">
          Character Sheet
        </div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 pt-4">
          <div className="w-32 h-32 rounded-none border-4 border-brand-black bg-brand-gray overflow-hidden shrink-0 shadow-[8px_8px_0px_0px_rgba(10,10,10,1)]">
            {userProfile.avatar_url ? (
              <img src={userProfile.avatar_url} alt="Avatar" className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-display font-black text-6xl text-brand-black/30">
                {userProfile.username[0]}
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="text-sm font-mono font-bold text-brand-black/50 mb-1">ID: {userProfile.id.split('-')[0]}</div>
            <h1 className="text-4xl md:text-6xl font-display font-black uppercase tracking-tighter text-brand-black">
              {userProfile.username}
            </h1>
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
              {userProfile.badges && userProfile.badges.length > 0 ? (
                userProfile.badges.map(badge => (
                  <span key={badge} className="bg-broadcast-red text-white border-2 border-brand-black font-display font-black uppercase tracking-widest text-xs px-3 py-1 shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]">
                    {badge}
                  </span>
                ))
              ) : (
                <span className="bg-brand-gray text-brand-black/50 border-2 border-brand-black/20 font-display font-black uppercase tracking-widest text-xs px-3 py-1">
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
        <div className="bg-brand-black text-white border-4 border-brand-black p-6">
          <div className="text-sm font-display font-bold uppercase tracking-widest text-white/50 mb-4 border-b-2 border-white/20 pb-2">
            The Oracle Score
          </div>
          <div className="flex justify-between items-end">
            <div className="text-6xl font-mono font-black text-oracle-gold leading-none">
              {(userProfile.oracle_score * 100).toFixed(1)}<span className="text-2xl text-white/50">%</span>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-white/70">{userProfile.oracle_qualifying_episodes}</div>
              <div className="text-xs font-display font-bold uppercase tracking-widest text-white/40">Episodes</div>
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-white/70">
            Measures your ability to correctly predict the Top, Bottom, and Alignment before the episode airs.
          </p>
        </div>

        {/* Latent Points */}
        <div className="bg-white border-4 border-brand-black p-6 relative shadow-[8px_8px_0px_0px_rgba(10,10,10,1)]">
          <div className="text-sm font-display font-bold uppercase tracking-widest text-brand-black/50 mb-4 border-b-2 border-brand-black/10 pb-2">
            Latent Points
          </div>
          <div className="flex justify-between items-end">
            <div className="text-6xl font-mono font-black text-brand-black leading-none">
              {userProfile.latent_points_season}
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-brand-black/50">{userProfile.latent_points_alltime}</div>
              <div className="text-xs font-display font-bold uppercase tracking-widest text-brand-black/40">All-Time</div>
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-brand-black/70">
            Earned by locking in correct predictions and having your roasts upvoted by the community.
          </p>
        </div>

      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-brand-gray border-4 border-brand-black p-4 text-center">
          <div className="text-[10px] font-display font-black uppercase tracking-widest text-brand-black/50 mb-1">Voting Persona</div>
          <div className="text-lg font-display font-black uppercase">{userProfile.voting_personality || "Neutral"}</div>
        </div>
        <div className="bg-brand-gray border-4 border-brand-black p-4 text-center">
          <div className="text-[10px] font-display font-black uppercase tracking-widest text-brand-black/50 mb-1">Roast Crowns</div>
          <div className="text-2xl font-mono font-black text-broadcast-red">{userProfile.roast_crowns}</div>
        </div>
        <div className="bg-brand-gray border-4 border-brand-black p-4 text-center">
          <div className="text-[10px] font-display font-black uppercase tracking-widest text-brand-black/50 mb-1">Avg Vote Delta</div>
          <div className="text-2xl font-mono font-black">{userProfile.average_vote_delta?.toFixed(1) || "0.0"}</div>
        </div>
        <div className="bg-brand-gray border-4 border-brand-black p-4 text-center">
          <div className="text-[10px] font-display font-black uppercase tracking-widest text-brand-black/50 mb-1">Trust Score</div>
          <div className="text-2xl font-mono font-black text-oracle-green">{userProfile.trust_score?.toFixed(2)}</div>
        </div>
      </div>
      
    </div>
  );
}
