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

export default async function PanelPage() {
  const session = await getServerSession(authOptions);
  const judges = await getPanelMembers();
  const supabase = getServiceSupabase();

  let dbReady = true;
  const byJudge = {};
  const myRatings = {};

  try {
    const { data, error } = await supabase
      .from("JudgeRating")
      .select("judge_id, user_id, harshness_score, accuracy_score, entertainment_score, comment");
    if (error) throw error;
    for (const row of data || []) {
      (byJudge[row.judge_id] ||= []).push(row);
      if (session?.user && row.user_id === session.user.id) {
        myRatings[row.judge_id] = {
          harshness: row.harshness_score,
          accuracy: row.accuracy_score,
          entertainment: row.entertainment_score,
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
  let maxEnt = -1;
  for (const j of enriched) {
    if (j.agg.count > 0 && j.agg.harshnessStdDev > maxStdDev) {
      maxStdDev = j.agg.harshnessStdDev;
      mostControversialId = j.id;
    }
    if (j.agg.count > 0 && j.agg.avgEntertainment > maxEnt) {
      maxEnt = j.agg.avgEntertainment;
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
    />
  );
}
