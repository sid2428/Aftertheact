import { getServiceSupabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { triggerRevelation } from "@/app/actions/revelation";

export async function GET(request) {
  // In production, you would verify the Vercel cron secret header here:
  // if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new NextResponse('Unauthorized', { status: 401 });
  // }

  const supabase = getServiceSupabase();

  try {
    // 1. Find all LIVE episodes
    const { data: liveEpisodes } = await supabase
      .from("Episode")
      .select("id, voting_window_close")
      .eq("status", "LIVE");

    if (!liveEpisodes || liveEpisodes.length === 0) {
      return NextResponse.json({ success: true, message: "No live episodes to flush." });
    }

    // 2. For each live episode, tally the durable UserVote rows into the
    // per-contestant verdict aggregates. UserVote is the source of truth
    // (Redis is only for live duplicate-prevention / SSE and can expire), and
    // it carries `trust_score_at_vote`, which is what the weighted verdict —
    // the value the reveal scoring actually reads — is built from.
    let revealed = 0;
    for (const ep of liveEpisodes) {
      const episodeId = ep.id;

      const { data: votes } = await supabase
        .from("UserVote")
        .select("contestant_id, score, trust_score_at_vote")
        .eq("episode_id", episodeId);

      // 3. Aggregate per contestant:
      //   raw verdict      = simple mean of scores
      //   weighted verdict = trust-weighted mean (Σ score·trust / Σ trust)
      const agg = {};
      for (const v of votes || []) {
        const trust = Number.isFinite(Number(v.trust_score_at_vote)) ? Number(v.trust_score_at_vote) : 0;
        const score = Number(v.score);
        if (!Number.isFinite(score)) continue;
        const a = (agg[v.contestant_id] ||= { sum: 0, count: 0, wSum: 0, wTrust: 0 });
        a.sum += score;
        a.count += 1;
        a.wSum += score * trust;
        a.wTrust += trust;
      }

      for (const [contestantId, a] of Object.entries(agg)) {
        if (a.count === 0) continue;
        const rawAverage = a.sum / a.count;
        // Fall back to the raw average if every vote carried zero trust, so a
        // contestant with votes is never left at a 0 weighted verdict.
        const weightedAverage = a.wTrust > 0 ? a.wSum / a.wTrust : rawAverage;

        await supabase
          .from("ContestantEpisodeAppearance")
          .update({
            peoples_verdict_raw: rawAverage,
            peoples_verdict_weighted: weightedAverage,
            total_votes_raw: a.count,
            total_votes_weighted: a.wTrust
          })
          .match({ episode_id: episodeId, contestant_id: contestantId });
      }

      if (ep.voting_window_close && new Date(ep.voting_window_close).getTime() <= Date.now()) {
        const result = await triggerRevelation(episodeId);
        if (result.success) revealed += 1;
      }
    }

    return NextResponse.json({ success: true, flushed: liveEpisodes.length, revealed });

  } catch (error) {
    console.error("Flush Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
