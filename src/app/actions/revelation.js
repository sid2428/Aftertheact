"use server";

import { getServiceSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function triggerRevelation(episodeId) {
  const supabase = getServiceSupabase();

  // 1. Get episode and appearances
  const { data: episode } = await supabase.from("Episode").select("*").eq("id", episodeId).single();
  if (episode?.status === "REVEALED" || episode?.status === "ARCHIVED") {
    return { success: false, error: "Episode is already revealed." };
  }

  const { data: appearances } = await supabase
    .from("ContestantEpisodeAppearance")
    .select("*")
    .eq("episode_id", episodeId);

  // 2. Compute Latent Scores
  for (const app of appearances) {
    const peoplesVerdict = app.peoples_verdict_raw || 0; 
    const judgeAverage = app.judge_average || 0; // Assume admin entered this earlier
    
    const latentScore = (peoplesVerdict * 0.5) + (judgeAverage * 0.5);
    const controversy = Math.abs(peoplesVerdict - judgeAverage) >= 3.0;

    await supabase
      .from("ContestantEpisodeAppearance")
      .update({
        peoples_verdict_weighted: peoplesVerdict, // Trust engine would modify this in background later, but we set it here for V1
        latent_score: latentScore,
        controversy_flag: controversy
      })
      .eq("id", app.id);
  }

  // 3. Score the Predictions (Top, Bottom, Alignment)
  // Find actual Top and Bottom based on latent_score
  const sorted = [...appearances].sort((a, b) => (b.peoples_verdict_raw * 0.5 + b.judge_average * 0.5) - (a.peoples_verdict_raw * 0.5 + a.judge_average * 0.5));
  const actualTopId = sorted[0]?.contestant_id;
  const actualBottomId = sorted[sorted.length - 1]?.contestant_id;
  
  // Calculate average divergence for alignment
  const avgDivergence = appearances.reduce((acc, app) => acc + Math.abs((app.peoples_verdict_raw||0) - (app.judge_average||0)), 0) / (appearances.length || 1);
  const actualAlignment = avgDivergence < 1.5;

  // Update UserPredictions
  const { data: predictions } = await supabase.from("UserPrediction").select("*").eq("episode_id", episodeId);
  if (predictions) {
    for (const p of predictions) {
      const topCorrect = p.predicted_top_contestant_id === actualTopId;
      const bottomCorrect = p.predicted_bottom_contestant_id === actualBottomId;
      const alignCorrect = p.predicted_alignment === actualAlignment;
      
      let points = 0;
      if (topCorrect) points += 25;
      if (bottomCorrect) points += 25;
      if (alignCorrect) points += 15;
      if (topCorrect && bottomCorrect && alignCorrect) points += 25; // Oracle Bonus

      await supabase.from("UserPrediction").update({
        top_correct: topCorrect,
        bottom_correct: bottomCorrect,
        alignment_correct: alignCorrect,
        points_earned: points
      }).eq("id", p.id);

      // Ledger entry for points
      if (points > 0) {
        await supabase.from("LatentPointsLedger").insert({
          user_id: p.user_id,
          episode_id: episodeId,
          action_type: "prediction_score",
          points: points
        });
      }
    }
  }

  // 4. Update episode status to REVEALED and trigger SSE
  await supabase.from("Episode").update({ status: "REVEALED", is_revelation_triggered: true }).eq("id", episodeId);
  
  // In a real scenario, we'd fire an event to Redis here to notify SSE clients of the flip
  // await redis.publish(`episode:${episodeId}:events`, "REVEALED");

  // Generate share cards asynchronously
  fetch(`${process.env.NEXTAUTH_URL}/api/cron/generate-cards?episodeId=${episodeId}`, { method: 'POST' }).catch(console.error);

  revalidatePath(`/episode/${episodeId}`);
  revalidatePath(`/admin/episodes`);

  return { success: true };
}
