import { getServiceSupabase } from "@/lib/supabase";
import EpisodeDirectory from "@/components/EpisodeDirectory";
import LineupPosters from "@/components/LineupPosters";
import ScrollStepper from "@/components/ScrollStepper";
import ArcCarousel from "@/components/ArcCarousel";
import TypeOnce from "@/components/TypeOnce";

// How scoring works, for anyone landing on the lineup cold.
const SCORING_STEPS = [
  {
    label: "While Live",
    title: "Cast Your Verdict",
    body: "When an episode is LIVE, score every act before the window shuts. One vote each — and once it closes, there are no take-backs.",
  },
  {
    label: "In Real Time",
    title: "Watch It Settle",
    body: "Votes pour in and the scoreboard reorders live. Ranks climb, ranks slip, and the top spot changes hands right in front of you.",
  },
  {
    label: "When It's Over",
    title: "Read The Receipts",
    body: "Voting closes and the Crowd Score is revealed against the Self and Panel scores. The board is final. Then the roast begins.",
  },
];

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
            <TypeOnce text="THE" sessionKey="hero-lineup-1" speed={70} />
            <br />
            <TypeOnce text="LINEUP" sessionKey="hero-lineup-2" speed={70} delay={260} />
          </h1>

          {/* Morphing recent-episode posters */}
          {recent.length > 0 && <LineupPosters episodes={episodes || []} />}
        </div>
      </section>

      {/* The Episodes Arc Carousel (Replacing How Scoring Works and grid) */}
      <ArcCarousel episodes={episodes || []} />
    </>
  );
}
