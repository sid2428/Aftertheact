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
    .in("status", ["LIVE", "REVEALED", "ARCHIVED"])
    .order("season_number", { ascending: false })
    .order("episode_number", { ascending: false });

  const { episode: episodeParam } = await searchParams;
  const selectedEpisodeId = episodes?.some((e) => e.id === episodeParam) ? episodeParam : episodes?.[0]?.id || null;

  let dbReady = true;
  const byJudge = {};
  const myRatings = {};

  try {
    let query = supabase.from("JudgeRating").select("judge_id, user_id, overall_score, tag, comment");
    query = selectedEpisodeId ? query.eq("episode_id", selectedEpisodeId) : query.is("episode_id", null);
    const { data, error } = await query;
    if (error) throw error;
    for (const row of data || []) {
      (byJudge[row.judge_id] ||= []).push(row);
      if (session?.user && row.user_id === session.user.id) {
        myRatings[row.judge_id] = {
          overall: row.overall_score,
          tag: row.tag,
          comment: row.comment || "",
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
  let maxAvg = -1;
  for (const j of enriched) {
    if (j.agg.count > 0 && j.agg.overallStdDev > maxStdDev) {
      maxStdDev = j.agg.overallStdDev;
      mostControversialId = j.id;
    }
    if (j.agg.count > 0 && j.agg.avgOverall > maxAvg) {
      maxAvg = j.agg.avgOverall;
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
