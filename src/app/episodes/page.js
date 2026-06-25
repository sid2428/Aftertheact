import { getServiceSupabase } from "@/lib/supabase";
import EpisodeDirectory from "@/components/EpisodeDirectory";
import LineupPosters from "@/components/LineupPosters";

export const metadata = {
  title: "The Lineup",
  description: "Every episode of the trial. Vote on the live ones, relive the verdicts.",
};

export const revalidate = 60;

export default async function EpisodesPage() {
  const supabase = getServiceSupabase();
  const { data: episodes } = await supabase
    .from("Episode")
    .select("*, ContestantEpisodeAppearance(count)")
    .neq("status", "ARCHIVED")
    .order("episode_number", { ascending: false });

  const recent = (episodes || []).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[40vh] flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,_var(--tw-gradient-stops))] from-latent-crimson/8 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-12 flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
          <h1 className="text-6xl sm:text-8xl md:text-[8rem] font-display font-black tracking-tighter uppercase text-white leading-[0.85] drop-shadow-2xl">
            THE<br />LINEUP
          </h1>

          {/* Morphing recent-episode posters */}
          {recent.length > 0 && <LineupPosters episodes={episodes || []} />}
        </div>
      </section>

      <section className="max-w-7xl mx-auto p-6 sm:p-12 mt-4 mb-32 relative z-20">
        <EpisodeDirectory episodes={episodes || []} />
      </section>
    </>
  );
}
