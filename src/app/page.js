import { getServiceSupabase } from "@/lib/supabase";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import CurtainHero from "@/components/CurtainHero";
import JudgePanel from "@/components/JudgePanel";
import IntroSequence from "@/components/IntroSequence";
import FeaturedEpisodeSection from "@/components/FeaturedEpisodeSection";
import ArcCarousel from "@/components/ArcCarousel";
import { getPanelMembers } from "@/lib/panel";
import { buildMetadata } from "@/lib/seo";

// Head-only metadata for the homepage. Sets its own canonical ("/") and a richer
// share description; the root layout's title `default` already supplies the
// branded homepage <title>, so no title is set here. No effect on the rendered UI.
export const metadata = buildMetadata({
  path: "/",
  description:
    "The independent fan home for India's Got Latent (IGL): score every act, " +
    "watch the live verdict board reorder in real time, predict the winners, and " +
    "read the receipts after the show. Not affiliated with any official production.",
});

export default async function Home() {
  const session = await getServerSession(authOptions);
  const supabase = getServiceSupabase();
  const { data: episodes } = await supabase
    .from("Episode")
    .select("*, ContestantEpisodeAppearance(count)")
    .order("season_number", { ascending: false })
    .order("episode_number", { ascending: false })
    .limit(10);

  // Signed-in: jump straight to the live voting episode, otherwise the scoreboard.
  if (session?.user) {
    const live = episodes?.find((ep) => ep.status === "LIVE");
    redirect(live ? `/episode/${live.id}` : "/scoreboard");
  }

  const panelMembers = await getPanelMembers();

  // Featured episode = the live one if any, else the most recent (spec P0.5).
  const featuredEpisode = episodes?.find((ep) => ep.status === "LIVE") || episodes?.[0] || null;

  // Pull its scoreboard (top rows) and the latest community posts in parallel.
  const [appearancesRes, postsRes] = await Promise.all([
    featuredEpisode
      ? supabase
          .from("ContestantEpisodeAppearance")
          .select(
            "id, latent_score, self_score, judge_average, peoples_verdict_weighted, total_votes_raw, controversy_flag, Contestant ( id, name, talent_type, image_url, is_removed_by_request )"
          )
          .eq("episode_id", featuredEpisode.id)
      : Promise.resolve({ data: [] }),
    supabase
      .from("CommunityPost")
      .select("id, text, created_at, User ( username )")
      .eq("moderation_status", "VISIBLE")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const scoreboardRows = (appearancesRes.data || [])
    .filter((a) => a.Contestant && !a.Contestant.is_removed_by_request)
    .map((a) => ({
      id: a.id,
      name: a.Contestant.name,
      talentType: a.Contestant.talent_type,
      imageUrl: a.Contestant.image_url,
      score: a.latent_score ?? 0,
      judgeScore: a.judge_average,
      votes: a.total_votes_raw,
      controversy: a.controversy_flag,
    }))
    .sort((a, b) => b.score - a.score);

  const initialPosts = (postsRes.data || []).map((p) => ({
    id: p.id,
    text: p.text,
    created_at: p.created_at,
    username: p.User?.username || null,
  }));

  return (
    <IntroSequence>
      <div className="bg-[#0A0A0A] min-h-screen">

        <CurtainHero members={panelMembers} />

        {/* The Panel */}
        <JudgePanel members={panelMembers} />

        {/* The Episodes Arc Carousel (Replacing How Scoring Works) */}
        <ArcCarousel episodes={episodes || []} />

        {/* Featured episode: scoreboard + community feed (first scroll destination) */}
        <div className="mt-12">
          <FeaturedEpisodeSection
            episode={featuredEpisode}
            scoreboardRows={scoreboardRows}
            initialPosts={initialPosts}
          />
        </div>

        <section className="max-w-7xl mx-auto p-6 sm:p-12 mt-20 mb-32 space-y-24 relative z-20">

          {/* Season pulse — quick stats + a way into the boards */}
          <SeasonStatsBand episodes={episodes || []} />
        </section>

      </div>
    </IntroSequence>
  );
}

// Replaces the old controversy seismograph at the foot of the homepage: a calm
// stats strip that sums up the season and points into the boards.
function SeasonStatsBand({ episodes }) {
  const episodeCount = episodes.length;
  const liveCount = episodes.filter((e) => e.status === "LIVE").length;
  const actCount = episodes.reduce(
    (sum, e) => sum + (e.ContestantEpisodeAppearance?.[0]?.count ?? 0),
    0
  );

  const stats = [
    { label: "Episodes", value: episodeCount },
    { label: "Acts Judged", value: actCount },
    { label: liveCount > 0 ? "Live Now" : "Live Episodes", value: liveCount, live: liveCount > 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
        <h2 className="text-2xl font-display uppercase tracking-widest text-white">The Season So Far</h2>
      </div>
      <div className="glass-panel rounded-2xl p-6 sm:p-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_auto] lg:items-center shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
        <div className="grid grid-cols-3 gap-4 sm:gap-8">
          {stats.map((s, i) => (
            <div key={s.label} className="text-center sm:text-left animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div
                className={`font-number font-bold leading-none text-5xl sm:text-6xl ${
                  s.live ? "text-latent-crimson drop-shadow-[0_0_14px_rgba(139,30,45,0.4)]" : "text-latent-gold drop-shadow-[0_0_14px_rgba(212,175,55,0.2)]"
                }`}
              >
                {s.value}
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 sm:justify-start">
                {s.live && <span className="h-2 w-2 rounded-full bg-latent-crimson animate-pulse-fast shadow-[0_0_8px_rgba(139,30,45,1)]" />}
                <span className="font-display text-[11px] uppercase tracking-widest text-white/40">{s.label}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
          <Link
            href="/scoreboard"
            className="group relative overflow-hidden text-center border-4 border-latent-gold bg-[#120f02] text-latent-gold font-display font-black uppercase tracking-widest text-sm px-8 py-4 shadow-[4px_4px_0px_0px_#8B1E2D] hover:shadow-[8px_8px_0px_0px_#E53935] transition-all transform hover:-translate-y-1"
          >
            <span className="relative z-10">View the Verdict Board</span>
            <div className="absolute inset-0 bg-latent-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
          </Link>
          <Link
            href="/community"
            className="group relative overflow-hidden text-center border-4 border-white/15 text-white/80 font-display font-black uppercase tracking-widest text-sm px-8 py-4 hover:border-latent-gold/50 hover:text-latent-gold shadow-[4px_4px_0px_0px_#161616] transition-all transform hover:-translate-y-1"
          >
            <span className="relative z-10">Enter the Green Room</span>
            <div className="absolute inset-0 bg-latent-gold/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
          </Link>
        </div>
      </div>
    </div>
  );
}
