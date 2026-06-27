import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";
import { getPanelMembers } from "@/lib/panel";
import { aggregateRatings } from "@/lib/judges";
import JudgePageClient from "@/components/JudgePageClient";

export const metadata = {
  alternates: { canonical: "/panel" },
  title: "Judge the Judges",
  description: "The jury is now on trial.",
};

export const revalidate = 0;

export default async function PanelPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const allJudges = await getPanelMembers();
  const supabase = getServiceSupabase();

  // Judges are allocated per episode — pick the episode to rate/view, newest first.
  const { data: episodes } = await supabase
    .from("Episode")
    .select("id, season_number, episode_number, title, status, judge_ids")
    .in("status", ["LIVE", "REVEALED"])
    .order("season_number", { ascending: false })
    .order("episode_number", { ascending: false });

  const { episode: episodeParam } = await searchParams;
  const selectedEpisode = episodes?.find((e) => e.id === episodeParam) || episodes?.[0] || null;
  const selectedEpisodeId = selectedEpisode?.id || null;

  // Only judges allocated to the selected episode appear (Redis pool filtered by
  // the episode's judge_ids).
  const allocatedIds = selectedEpisode?.judge_ids || [];
  const judges = allJudges.filter((j) => allocatedIds.includes(j.id));

  let dbReady = true;
  const byJudge = {};
  const myRatings = {};

  try {
    // One rating per (judge, user, episode). The judge's final score aggregates
    // EVERY rating across all episodes, trust-weighted (Σ score·trust / Σ trust);
    // the episode pill-tabs pick which episode your vote applies to.
    // Only judges allocated to this episode are rendered, so scope the scan to them
    // (the aggregate is still trust-weighted across ALL episodes — just for these judges).
    // idx_judgerating_judge_id serves this lookup.
    const { data, error } = allocatedIds.length
      ? await supabase
          .from("JudgeRating")
          .select("judge_id, user_id, episode_id, harshness_score, accuracy_score, entertainment_score, comment, User(trust_score)")
          .in("judge_id", allocatedIds)
      : { data: [], error: null };
    if (error) throw error;
    for (const row of data || []) {
      const avgScore = (row.harshness_score + row.accuracy_score + row.entertainment_score) / 3;
      (byJudge[row.judge_id] ||= []).push({ score: avgScore, trust: row.User?.trust_score ?? 0 });
      // "My rating" is scoped to the selected episode, to prefill the form and
      // show "already rated" for this episode only.
      if (session?.user && row.user_id === session.user.id && row.episode_id === selectedEpisodeId) {
        myRatings[row.judge_id] = { score: Math.round(avgScore), comment: row.comment || "" };
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
