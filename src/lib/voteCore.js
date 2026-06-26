import { getServiceSupabase } from "./supabase.js";
import { redis } from "./upstash.js";
import { normalizeScore } from "./utils.js";

// The bare server-side write a single vote performs — the "absolute basic call
// of sending the data to server", with NO auth, session, episode-status, or
// email concerns. Shared by:
//   • the submitVote server action (src/app/actions/vote.js), which wraps this in
//     auth + episode/contestant validation + the confirmation email, and
//   • the simulation script (scripts/simulate-igl.mjs), which calls it directly
//     so seeded votes hit the EXACT same Redis aggregates + UserVote write a real
//     website vote does (live scoreboard climbs identically; reveal reads the
//     same UserVote rows).
//
// Steps (mirrors the original submitVote body):
//   1. normalize score (1–10, 0.1)         4. atomic Redis aggregates (total/count)
//   2. duplicate guard (Redis, then PG)    5. unique-voter counter (voter_count)
//   3. Redis vote marker (24h)             6. durable UserVote upsert (awaited)
//
// `skipDupCheck` lets the simulation skip the per-vote Redis+PG duplicate lookup
// when seeding a known-fresh DB (the unique upsert still prevents real dupes),
// which keeps bulk seeding cheap on Upstash.
export async function recordVote({
  userId,
  episodeId,
  contestantId,
  score,
  trustScore = 0.3,
  skipDupCheck = false,
}) {
  score = normalizeScore(score);
  if (score === null) {
    return { success: false, error: "Invalid score. Must be between 1 and 10." };
  }

  const supabase = getServiceSupabase();
  const voteKey = `vote:${episodeId}:${contestantId}:${userId}`;
  const hashKey = `episode:${episodeId}:scores`;

  // 2. Duplicate guard: fast Redis check, then a hard Postgres check so a cleared
  //    Redis cache can't let a double-count through.
  if (!skipDupCheck) {
    const hasVotedRedis = await redis.get(voteKey);
    if (hasVotedRedis) {
      return { success: false, duplicate: true, error: "You have already voted for this contestant." };
    }
    const { data: existingVote } = await supabase
      .from("UserVote")
      .select("id")
      .eq("user_id", userId)
      .eq("episode_id", episodeId)
      .eq("contestant_id", contestantId)
      .maybeSingle();
    if (existingVote) {
      await redis.setex(voteKey, 86400, score); // restore the lock
      return { success: false, duplicate: true, error: "You have already voted for this contestant." };
    }
  }

  // 3. Mark voted in Redis (24h; permanent record lives in Postgres).
  await redis.setex(voteKey, 86400, score);

  // 4. Atomically accumulate the live aggregate the SSE/flush routes read back.
  const [newTotal, newCount] = await Promise.all([
    redis.hincrbyfloat(hashKey, `${contestantId}:total`, score),
    redis.hincrby(hashKey, `${contestantId}:count`, 1),
  ]);

  // 5. Bump the unique-voter counter only on a user's first vote in the episode.
  const firstVoteMarker = await redis.set(`episode:${episodeId}:voted:${userId}`, 1, {
    nx: true,
    ex: 86400,
  });
  if (firstVoteMarker) {
    await redis.hincrby(hashKey, "voter_count", 1);
    await redis.expire(hashKey, 60 * 60 * 24 * 7); // backstop TTL
  }

  // 6. Durable permanent record. Upsert so a replay can't violate the unique
  //    constraint. Awaited here (the caller decides whether to block on it).
  const { error } = await supabase.from("UserVote").upsert(
    {
      user_id: userId,
      episode_id: episodeId,
      contestant_id: contestantId,
      score,
      trust_score_at_vote: trustScore ?? 0.3, // nullish: a real 0 trust must survive
    },
    { onConflict: "user_id,episode_id,contestant_id" }
  );

  if (error) {
    console.error(
      JSON.stringify({ event: "vote_insert_failed", userId, episodeId, contestantId, score, error: error.message })
    );
    return { success: false, error: error.message };
  }

  const total = Number(newTotal);
  const count = Number(newCount);
  return { success: true, newRawAverage: count > 0 ? total / count : score };
}
