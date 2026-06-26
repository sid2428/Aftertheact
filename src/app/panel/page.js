import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";
import { getPanelMembers } from "@/lib/panel";
import { aggregateRatings } from "@/lib/judges";
import JudgePageClient from "@/components/JudgePageClient";

export const metadata = {
  title: "Judge the Judges",
  description: "The jury is now on trial.",
};

export const revalidate = 0;

export default async function PanelPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const judges = await getPanelMembers();
  const supabase = getServiceSupabase();

  // Judges are classified per episode — pick the episode to rate/view, newest first.
  const { data: episodes } = await supabase
    .from("Episode")
    .select("id, season_number, episode_number, title, status")
    .in("status", ["LIVE", "REVEALED"])
    .order("season_number", { ascending: false })
    .order("episode_number", { ascending: false });

  const { episode: episodeParam } = await searchParams;
  const selectedEpisodeId = episodes?.some((e) => e.id === episodeParam) ? episodeParam : episodes?.[0]?.id || null;

  let dbReady = true;
  const byJudge = {};
  const myRatings = {};

  try {
    // Ratings are global per (judge, user) — see migrations/0009-judgerating-unique-constraint.
    // ponytail: episode pill-tabs are cosmetic now; rate route has no episode context.
    const { data, error } = await supabase
      .from("JudgeRating")
      .select("judge_id, user_id, harshness_score, accuracy_score, entertainment_score, comment");
    if (error) throw error;
    for (const row of data || []) {
      const avgScore = (row.harshness_score + row.accuracy_score + row.entertainment_score) / 3;
      const mappedRow = {
        judge_id: row.judge_id,
        user_id: row.user_id,
        score: avgScore,
        comment: row.comment
      };
      (byJudge[mappedRow.judge_id] ||= []).push(mappedRow);
      if (session?.user && mappedRow.user_id === session.user.id) {
        myRatings[mappedRow.judge_id] = {
          score: Math.round(mappedRow.score),
          comment: mappedRow.comment || "",
        };
      }
    }
  } catch (err) {
    console.error("panel page load:", err.message);
    dbReady = false;
  }

  // Build per-judge aggregates and badge winners.
  const enriched = judges.map((j) => ({ ...j, agg: aggregateRatings(byJudge[j.id] || []) }));

  let mostControversialId = null;
  let fanFavouriteId = null;
  let maxStdDev = -1;
  let maxScore = -1;
  for (const j of enriched) {
    if (j.agg.count > 0 && j.agg.stdDev > maxStdDev) {
      maxStdDev = j.agg.stdDev;
      mostControversialId = j.id;
    }
    if (j.agg.count > 0 && j.agg.avgScore > maxScore) {
      maxScore = j.agg.avgScore;
      fanFavouriteId = j.id;
    }
  }

  return (
    <JudgePageClient
      judges={enriched}
      myRatings={myRatings}
      mostControversialId={mostControversialId}
      fanFavouriteId={fanFavouriteId}
      dbReady={dbReady}
      isLoggedIn={!!session?.user}
      episodes={episodes || []}
      selectedEpisodeId={selectedEpisodeId}
    />
  );
}
