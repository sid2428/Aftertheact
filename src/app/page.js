import { getServiceSupabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DivergenceSeismograph from "@/components/DivergenceSeismograph";
import EpisodeDirectory from "@/components/EpisodeDirectory";
import CurtainHero from "@/components/CurtainHero";
import JudgePanel from "@/components/JudgePanel";
import IntroSequence from "@/components/IntroSequence";
import { getPanelMembers } from "@/lib/panel";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const supabase = getServiceSupabase();
  const { data: episodes } = await supabase
    .from("Episode")
    .select("*")
    .order("season_number", { ascending: false })
    .order("episode_number", { ascending: false })
    .limit(10);

  // Signed-in: jump straight to the live voting episode, otherwise the scoreboard.
  if (session?.user) {
    const live = episodes?.find((ep) => ep.status === "LIVE");
    redirect(live ? `/episode/${live.id}` : "/scoreboard");
  }

  const panelMembers = await getPanelMembers();

  return (
    <IntroSequence>
      <div className="bg-[#0A0A0A] min-h-screen">

        <CurtainHero members={panelMembers} />

        {/* The Panel */}
        <JudgePanel members={panelMembers} />

        {/* Divergence & Episodes Feed */}
        <section className="max-w-7xl mx-auto p-6 sm:p-12 mt-12 mb-32 space-y-24 relative z-20">

          {/* Live Controversy Meter */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
              <div className="w-3 h-3 rounded-full bg-latent-crimson animate-pulse-fast" />
              <h2 className="text-2xl font-display font-black uppercase tracking-widest text-white">Live Controversy Meter</h2>
            </div>
            <div className="glass-panel p-6 rounded-md">
              <DivergenceSeismograph divergenceValue={2.45} history={[0.5, 1.2, -0.8, 2.1, 3.5, 1.8, 0.2, -1.5, 2.45]} />
            </div>
          </div>

          {/* Episode Directory */}
          <EpisodeDirectory episodes={episodes || []} />
        </section>

      </div>
    </IntroSequence>
  );
}
