import { getServiceSupabase } from "@/lib/supabase";
import { redis } from "@/lib/upstash";
import { NextResponse } from "next/server";

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
      .select("id")
      .eq("status", "LIVE");

    if (!liveEpisodes || liveEpisodes.length === 0) {
      return NextResponse.json({ success: true, message: "No live episodes to flush." });
    }

    // 2. For each live episode, fetch the Redis score hash
    for (const ep of liveEpisodes) {
      const episodeId = ep.id;
      const scores = await redis.hgetall(`episode:${episodeId}:scores`);

      if (!scores) continue;

      // 3. Reassemble the flat `{contestantId}:total` / `{contestantId}:count`
      // fields into per-contestant aggregates, then write each to Postgres.
      const totals = {};
      const counts = {};
      for (const [field, value] of Object.entries(scores)) {
        const sep = field.lastIndexOf(":");
        if (sep === -1) continue;
        const contestantId = field.slice(0, sep);
        const kind = field.slice(sep + 1);
        const num = Number(value);
        if (!Number.isFinite(num)) continue;
        if (kind === "total") totals[contestantId] = num;
        else if (kind === "count") counts[contestantId] = num;
      }

      for (const [contestantId, votesCount] of Object.entries(counts)) {
        if (votesCount > 0) {
          const rawAverage = (totals[contestantId] || 0) / votesCount;

          await supabase
            .from("ContestantEpisodeAppearance")
            .update({
              peoples_verdict_raw: rawAverage,
              total_votes_raw: votesCount
            })
            .match({ episode_id: episodeId, contestant_id: contestantId });
        }
      }
    }

    return NextResponse.json({ success: true, flushed: liveEpisodes.length });

  } catch (error) {
    console.error("Flush Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
