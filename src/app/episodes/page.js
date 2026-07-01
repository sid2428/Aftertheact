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
  title: "India's Got Latent Episodes — Vote & Verdicts",
  description: "The Lineup: every episode of India's Got Latent. Vote on the live ones, relive the verdicts, and see how the crowd scored each act.",
  alternates: { canonical: "/episodes" },
};

export const revalidate = 60;

export default async function EpisodesPage() {
  const supabase = getServiceSupabase();
  const { data: episodes } = await supabase
    .from("Episode")
    .select("*, ContestantEpisodeAppearance(count)")
    .neq("status", "ARCHIVED")
    .order("season_number", { ascending: false })
    .order("episode_number", { ascending: false });

  const recent = (episodes || []).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden flex items-center pt-6 pb-2">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,_var(--tw-gradient-stops))] from-latent-crimson/8 via-transparent to-transparent pointer-events-none" />
        {/* Ambient glow behind LINEUP */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[radial-gradient(ellipse,rgba(212,175,55,0.12),transparent_70%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-6 flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          <h1 className="text-6xl sm:text-8xl md:text-[8rem] font-display font-black tracking-tighter uppercase text-white leading-[0.85] drop-shadow-2xl">
            <TypeOnce text="THE" sessionKey="hero-lineup-1" speed={70} />
            <br />
            <span className="relative inline-block">
              <TypeOnce text="LINEUP" sessionKey="hero-lineup-2" speed={70} delay={260} />
              {/* Gold underline with glow */}
              <span
                aria-hidden
                className="absolute left-0 -bottom-2 w-full h-[5px] rounded-full"
                style={{
                  background: "linear-gradient(90deg, #F5D97B 0%, #D4AF37 50%, #B8860B 100%)",
                  boxShadow: "0 0 18px 4px rgba(212,175,55,0.55), 0 0 40px 8px rgba(212,175,55,0.25)",
                }}
              />
            </span>
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
