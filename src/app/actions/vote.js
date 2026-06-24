"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";
import { redis } from "@/lib/upstash";
import { normalizeScore } from "@/lib/utils";

export async function submitVote(episodeId, contestantId, score) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { success: false, error: "Must be logged in to vote." };
  }

  const userId = session.user.id;

  // Validate the identifiers coming from the client. Both must be non-empty
  // strings before they ever touch the database or Redis.
  if (typeof episodeId !== "string" || episodeId.trim() === "" ||
      typeof contestantId !== "string" || contestantId.trim() === "") {
    return { success: false, error: "Invalid request." };
  }

  // Validate score: finite number in [1, 10], quantized to 0.1. Never trust the client.
  score = normalizeScore(score);
  if (score === null) {
    return { success: false, error: "Invalid score. Must be between 1 and 10." };
  }

  const supabase = getServiceSupabase();

  // 1. Check the voting window is open AND this contestant is actually in this episode.
  const { data: episode } = await supabase
    .from("Episode")
    .select("status")
    .eq("id", episodeId)
    .single();

  if (episode?.status !== "LIVE") {
    return { success: false, error: "Voting window is closed." };
  }

  const { count: inEpisode } = await supabase
    .from("ContestantEpisodeAppearance")
    .select("id", { count: "exact", head: true })
    .eq("episode_id", episodeId)
    .eq("contestant_id", contestantId);

  if (!inEpisode) {
    return { success: false, error: "Contestant is not part of this episode." };
  }

  // 2. Rate limiting / Duplicate vote check in Redis (fast)
  // Key: vote:{episodeId}:{contestantId}:{userId}
  const hasVoted = await redis.get(`vote:${episodeId}:${contestantId}:${userId}`);
  if (hasVoted) {
    return { success: false, error: "You have already voted for this contestant." };
  }

  // 3. Mark as voted in Redis (24h expiry is enough, permanent record goes to Postgres later)
  await redis.setex(`vote:${episodeId}:${contestantId}:${userId}`, 86400, score);

  // 4. Atomically update the aggregate in Redis.
  // Two server-side atomic ops avoid the lost-update race the old get/parse/set had:
  //   - HINCRBYFLOAT accumulates the running total score
  //   - HINCRBY accumulates the running vote count
  // The SSE and flush routes read these `:total` / `:count` fields back.
  const hashKey = `episode:${episodeId}:scores`;
  const [newTotal, newCount] = await Promise.all([
    redis.hincrbyfloat(hashKey, `${contestantId}:total`, score),
    redis.hincrby(hashKey, `${contestantId}:count`, 1),
  ]);

  // 4b. Track unique voters for this episode. Only bump the counter the first
  // time a given user votes in the episode, so it reflects people, not ballots.
  const firstVoteMarker = await redis.set(
    `episode:${episodeId}:voted:${userId}`,
    1,
    { nx: true, ex: 86400 }
  );
  if (firstVoteMarker) {
    await redis.incr(`episode:${episodeId}:voter_count`);
  }

  // 5. Fire and forget to Postgres (permanent record).
  // Upsert (not insert) so a replayed vote can't violate the unique constraint;
  // we never block the user response waiting for this write.
  supabase.from("UserVote").upsert({
    user_id: userId,
    episode_id: episodeId,
    contestant_id: contestantId,
    score: score,
    trust_score_at_vote: session.user.trust_score ?? 0.3 // nullish: a real 0 trust score must survive
  }, { onConflict: "user_id,episode_id,contestant_id" }).then(({ error }) => {
    if (error) {
      console.error(JSON.stringify({
        event: "vote_insert_failed",
        userId,
        episodeId,
        contestantId,
        score,
        error: error.message,
      }));
    }
  });

  const total = Number(newTotal);
  const count = Number(newCount);
  return { success: true, newRawAverage: count > 0 ? total / count : score };
}
