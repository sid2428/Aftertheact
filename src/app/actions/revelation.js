"use server";

import { getServiceSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function triggerRevelation(episodeId) {
  const supabase = getServiceSupabase();

  // Call the idempotent PostgreSQL RPC function
  const { error } = await supabase.rpc("score_episode_predictions", { p_episode_id: episodeId });

  if (error) {
    console.error("RPC Error:", error);
    return { success: false, error: `Failed to reveal episode: ${error.message}` };
  }

  // Award latent points (vote accuracy + post karma) now that the crowd verdict
  // is final. Idempotent (ledger-based), so a retried reveal never double-counts.
  const { error: pointsError } = await supabase.rpc("award_episode_latent_points", { p_episode_id: episodeId });
  if (pointsError) {
    console.error("Latent points RPC Error:", pointsError);
    return { success: false, error: `Failed to award latent points: ${pointsError.message}` };
  }

  // Generate share cards asynchronously
  fetch(`${process.env.NEXTAUTH_URL}/api/cron/generate-cards?episodeId=${episodeId}`, { method: 'POST' }).catch(console.error);

  revalidatePath(`/episode/${episodeId}`);
  revalidatePath(`/admin/episodes`);
  revalidatePath(`/leaderboard`);

  return { success: true };
}

export async function triggerExpiredRevelation(episodeId) {
  const supabase = getServiceSupabase();
  const { data: episode } = await supabase
    .from("Episode")
    .select("id, status, voting_window_close")
    .eq("id", episodeId)
    .single();

  if (
    episode?.status === "LIVE" &&
    episode.voting_window_close &&
    new Date(episode.voting_window_close).getTime() <= Date.now()
  ) {
    return triggerRevelation(episodeId);
  }

  return { success: false, skipped: true };
}
