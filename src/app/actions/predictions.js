"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";

export async function submitPredictions({ episodeId, topId, bottomId, alignment }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { success: false, error: "Must be logged in to predict." };
  }

  const supabase = getServiceSupabase();

  // Check if window is open (UPCOMING only)
  const { data: episode } = await supabase
    .from("Episode")
    .select("status")
    .eq("id", episodeId)
    .single();

  if (episode?.status !== "UPCOMING") {
    return { success: false, error: "Prediction window is closed. Episode is already live or revealed." };
  }

  // Insert or Update prediction
  const { error } = await supabase
    .from("UserPrediction")
    .upsert({
      user_id: session.user.id,
      episode_id: episodeId,
      predicted_top_contestant_id: topId,
      predicted_bottom_contestant_id: bottomId,
      predicted_alignment: alignment
    }, { onConflict: 'user_id, episode_id' });

  if (error) {
    console.error("Prediction insert error:", error);
    return { success: false, error: "Failed to save prediction. Try again." };
  }

  return { success: true };
}
