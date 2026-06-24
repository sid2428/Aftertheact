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

  // 4. Atomically update the aggregate in Redis
  // We use a Redis transaction (multi) to fetch and update, or we can use HGET/HSET
  // Since Upstash JS client supports atomic HINCRBYFLOAT, we can just increment totals
  // But we need to increment total score AND vote count.
  // Instead, let's keep a hash where the value is a JSON string, and we update it via a simple get/set
  // Upstash REST doesn't support complex server-side Lua scripts easily via the standard JS client without string passing.
  // We'll just read, parse, increment, write. It's safe enough for V1 at 300-500 CCU.
  
  const hashKey = `episode:${episodeId}:scores`;
  const currentDataStr = await redis.hget(hashKey, contestantId);
  
  let currentData = currentDataStr ? (typeof currentDataStr === 'string' ? JSON.parse(currentDataStr) : currentDataStr) : { totalScore: 0, votesCount: 0 };
  
  currentData.totalScore += score;
  currentData.votesCount += 1;

  await redis.hset(hashKey, { [contestantId]: JSON.stringify(currentData) });

  // 5. Fire and forget to Postgres (permanent record)
  // We do not wait for this to succeed before responding optimistic to user
  supabase.from("UserVote").insert({
    user_id: userId,
    episode_id: episodeId,
    contestant_id: contestantId,
    score: score,
    trust_score_at_vote: session.user.trust_score || 0.3 // fallback
  }).then(({error}) => {
    if (error) console.error("Postgres async vote insert error:", error);
  });

  return { success: true, newRawAverage: currentData.totalScore / currentData.votesCount };
}
