import { getServiceSupabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import LeaderboardClient from "./LeaderboardClient";

export const metadata = {
  title: "The Leaderboards | Oracle Accuracy and Season Standings",
  description: "The sharpest predictors and the highest-ranked jurors of the season.",
  alternates: { canonical: "/leaderboard" },
};

export const revalidate = 30;

// ── Karma Wall ranking ───────────────────────────────────────────────────────
// Raw accuracy alone is unfair: a juror who's 1-for-1 (100%) would outrank a
// proven predictor who's 47-for-50 (94%). So we rank by a *credibility-weighted*
// karma score — a Bayesian shrinkage that pulls a low-volume accuracy toward the
// field's average, and only lets it count at face value once enough predictions
// back it up. Net effect: more predictions + high accuracy wins, so the rightful
// predictor sits on top. Tune SMOOTHING to dial how much volume matters.
const SMOOTHING = 5; // ≈ predictions before your accuracy is trusted at face value

function rankByKarma(users) {
  const list = (users || []).filter((u) => (u.oracle_qualifying_episodes || 0) >= 1);
  if (list.length === 0) return [];

  // Prediction-weighted mean accuracy = the field's overall hit rate (the prior
  // every juror is shrunk toward until they have the volume to prove their own).
  let weightedSum = 0;
  let totalPreds = 0;
  for (const u of list) {
    const p = u.oracle_qualifying_episodes || 0;
    weightedSum += (u.oracle_score || 0) * p;
    totalPreds += p;
  }
  const meanAccuracy = totalPreds > 0 ? weightedSum / totalPreds : 0;

  return list
    .map((u) => {
      const p = u.oracle_qualifying_episodes || 0;
      const a = u.oracle_score || 0;
      // karma = trust·(your accuracy) + (1−trust)·(field average), where trust
      // grows with prediction count. Few predictions → mostly the field average;
      // many predictions → almost entirely your own accuracy.
      const karma = (p / (p + SMOOTHING)) * a + (SMOOTHING / (p + SMOOTHING)) * meanAccuracy;
      return { ...u, karma };
    })
    // Karma first; then sheer volume, then raw accuracy as final tie-breakers.
    .sort(
      (x, y) =>
        y.karma - x.karma ||
        (y.oracle_qualifying_episodes || 0) - (x.oracle_qualifying_episodes || 0) ||
        (y.oracle_score || 0) - (x.oracle_score || 0)
    );
}

export default async function LeaderboardPage() {
  const supabase = getServiceSupabase();
  const session = await getServerSession(authOptions);

  const [{ data: topUsers }, { data: oracleRows }, { data: latestSeason }] = await Promise.all([
    supabase
      .from("User")
      .select("id, username, latent_points_season, avatar_url, bio")
      .order("latent_points_season", { ascending: false })
      .limit(10),
    // Pull the whole qualifying field — karma ranking needs every predictor to
    // compute the field average and each person's true position, not just a
    // pre-sorted top 10 by raw accuracy.
    supabase
      .from("User")
      .select("id, username, oracle_score, oracle_qualifying_episodes, avatar_url, bio")
      .gte("oracle_qualifying_episodes", 1),
    // Drive the "Season N" label off real data so it never drifts from the rest
    // of the site (which references the live season's episodes).
    supabase
      .from("Episode")
      .select("season_number")
      .order("season_number", { ascending: false })
      .limit(1),
  ]);

  const seasonNumber = latestSeason?.[0]?.season_number ?? 1;

  // Rank the whole qualifying field by karma, then take the top 10 to display.
  const oraclesRanked = rankByKarma(oracleRows);
  const oracles = oraclesRanked.slice(0, 10);

  let seasonSelf = null;
  let oracleSelf = null;

  if (session?.user?.id) {
    const { data: me } = await supabase
      .from("User")
      .select("id, username, latent_points_season, avatar_url, oracle_score, oracle_qualifying_episodes, bio")
      .eq("id", session.user.id)
      .single();

    if (me) {
      const { count: higherSeason } = await supabase
        .from("User")
        .select("id", { count: "exact", head: true })
        .gt("latent_points_season", me.latent_points_season || 0);

      seasonSelf = {
        user: me,
        rank: (higherSeason || 0) + 1,
        inTop: topUsers?.some((u) => u.id === me.id) ?? false,
      };

      const qualified = (me.oracle_qualifying_episodes || 0) >= 1;
      let oracleRank = null;
      if (qualified) {
        // Rank the viewer using the very same karma ordering. Make sure they're
        // in the set being ranked, in case they fell outside the fetched rows.
        const field = (oracleRows || []).some((u) => u.id === me.id)
          ? oracleRows
          : [...(oracleRows || []), me];
        const idx = rankByKarma(field).findIndex((u) => u.id === me.id);
        oracleRank = idx >= 0 ? idx + 1 : null;
      }
      oracleSelf = {
        user: me,
        rank: oracleRank,
        qualified,
        inTop: oracles?.some((u) => u.id === me.id) ?? false,
      };
    }
  }

  return (
    <LeaderboardClient
      topUsers={topUsers || []}
      oracles={oracles || []}
      seasonSelf={seasonSelf}
      oracleSelf={oracleSelf}
      seasonNumber={seasonNumber}
    />
  );
}
