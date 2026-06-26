"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";
import { redis } from "@/lib/upstash";
import { normalizeScore } from "@/lib/utils";
import { sendEmail } from "@/lib/email";

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
    .select("status, title, season_number, episode_number, voting_window_close")
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
  const hasVotedRedis = await redis.get(`vote:${episodeId}:${contestantId}:${userId}`);
  if (hasVotedRedis) {
    return { success: false, error: "You have already voted for this contestant." };
  }

  // 2.5 Hard check against Postgres (permanent)
  // This prevents double-counting in Redis aggregates if the Redis cache was cleared
  // or the 24h expiry passed.
  const { data: existingVote } = await supabase
    .from("UserVote")
    .select("id")
    .eq("user_id", userId)
    .eq("episode_id", episodeId)
    .eq("contestant_id", contestantId)
    .maybeSingle();

  if (existingVote) {
    // Restore the Redis lock so we don't have to hit Postgres next time
    await redis.setex(`vote:${episodeId}:${contestantId}:${userId}`, 86400, score);
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
  // The count lives as a `voter_count` field INSIDE the scores hash so the live
  // SSE route reads everything it needs in a single HGETALL (one Redis command
  // per poll per client) instead of an extra GET — the dominant Upstash cost.
  const firstVoteMarker = await redis.set(
    `episode:${episodeId}:voted:${userId}`,
    1,
    { nx: true, ex: 86400 }
  );
  if (firstVoteMarker) {
    await redis.hincrby(hashKey, "voter_count", 1);
    // Defense-in-depth TTL so the live hash self-cleans if a reveal never runs.
    // The reveal path deletes it explicitly; this is the backstop. Refreshed on
    // each new voter, so it stays alive for the whole voting window.
    await redis.expire(hashKey, 60 * 60 * 24 * 7);
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

  // 6. Fire and forget email notification
  if (session.user.email) {
    const revealDate = episode?.voting_window_close ? new Date(episode.voting_window_close) : new Date(Date.now() + 48 * 60 * 60 * 1000);
    const formattedDate = revealDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const formattedTime = revealDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
    const msRemaining = Math.max(0, revealDate.getTime() - Date.now());
    const hrsRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
    const minsRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body {
            background-color: #0A0A0A;
            color: #ffffff;
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
            background-color: #0A0A0A;
          }
          .header {
            text-align: center;
            border-bottom: 1px solid #333;
            padding-bottom: 20px;
            margin-bottom: 40px;
          }
          .header h1 {
            color: #D4AF37; /* Latent Gold */
            text-transform: uppercase;
            letter-spacing: 4px;
            font-size: 14px;
            margin: 0;
          }
          .title {
            text-align: center;
            font-size: 36px;
            font-weight: 900;
            text-transform: uppercase;
            margin: 0 0 20px 0;
            letter-spacing: -1px;
            line-height: 1.1;
          }
          .accent {
            color: #D4AF37; /* Latent Gold */
          }
          .score-box {
            background: linear-gradient(145deg, #111111, #050505);
            border: 1px solid #8B1E2D; /* Latent Crimson */
            border-radius: 8px;
            padding: 40px 20px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 10px 30px rgba(139, 30, 45, 0.1);
          }
          .score-text {
            font-size: 56px;
            font-weight: 900;
            color: #ffffff;
            margin: 0;
            letter-spacing: 2px;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
          }
          .score-label {
            color: #8B1E2D;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 4px;
            font-size: 12px;
            margin-top: 10px;
          }
          .countdown-box {
            background: linear-gradient(145deg, #111111, #050505);
            border: 1px solid #D4AF37;
            border-radius: 8px;
            padding: 30px 20px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 10px 30px rgba(212, 175, 55, 0.1);
          }
          .countdown-text {
            font-size: 40px;
            font-weight: 900;
            color: #ffffff;
            margin: 0;
            letter-spacing: 2px;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
          }
          .countdown-label {
            color: #D4AF37;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 4px;
            font-size: 11px;
            margin-top: 10px;
          }
          .details {
            background-color: #111111;
            border-left: 4px solid #8B1E2D;
            padding: 20px;
            margin-top: 30px;
          }
          .details p {
            margin: 5px 0;
            color: #aaaaaa;
            font-size: 14px;
          }
          .details strong {
            color: #ffffff;
          }
          .footer {
            text-align: center;
            margin-top: 50px;
            color: #555555;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>After The Act</h1>
          </div>
          
          <h2 class="title">Vote <span class="accent">Registered</span></h2>
          
          <p style="text-align: center; color: #aaaaaa; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
            The jury has heard you. Your official verdict for <strong>S${episode?.season_number}E${episode?.episode_number} — ${episode?.title || "this episode"}</strong> has been securely logged into the system.
          </p>

          <div class="score-box">
            <h3 class="score-text">${score.toFixed(1)}</h3>
            <div class="score-label">Your Final Verdict</div>
          </div>

          <div class="countdown-box">
            <h3 class="countdown-text">${String(hrsRemaining).padStart(2, '0')}:${String(minsRemaining).padStart(2, '0')}</h3>
            <div class="countdown-label">Hours Until Reveal</div>
          </div>

          <div class="details">
            <p><strong>REVEAL DATE:</strong> ${formattedDate}</p>
            <p><strong>REVEAL TIME:</strong> ${formattedTime}</p>
            <p><strong>STATUS:</strong> Waiting for Live Broadcast</p>
          </div>
          
          <p style="text-align: center; color: #888888; font-size: 14px; line-height: 1.6; margin-top: 40px;">
            Your vote joins the crowd aggregate. The true community sentiment will remain hidden until the Live Reveal.
          </p>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} After The Act. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    sendEmail({
      to: session.user.email,
      subject: "Vote Registered: After The Act",
      html: htmlTemplate,
    }).catch(err => console.error("Failed to send vote email:", err));
  }

  const total = Number(newTotal);
  const count = Number(newCount);
  return { success: true, newRawAverage: count > 0 ? total / count : score };
}
