"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";

// Tier 1 Auto-Filter words (in a real app, this would be fetched from DB or Redis)
const AUTO_HOLD_KEYWORDS = ["caste", "religion", "chamar", "bhangi", "mulla", "kill", "doxx"];

export async function submitRoast({ episodeId, contestantId, content }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { success: false, error: "Must be logged in to roast." };
  }

  // Check shadow ban
  if (session.user.is_shadow_banned) {
    // If shadow banned, we pretend it worked but it never saves
    return { success: true, status: "PUBLISHED" };
  }

  if (content.length > 280) {
    return { success: false, error: "Keep it under 280 characters." };
  }

  const supabase = getServiceSupabase();

  // Tier 1 Auto-Hold check
  const isHeld = AUTO_HOLD_KEYWORDS.some(word => content.toLowerCase().includes(word));
  const moderationStatus = isHeld ? "HELD" : "PUBLISHED";

  const { error } = await supabase.from("Roast").insert({
    user_id: session.user.id,
    episode_id: episodeId,
    contestant_id: contestantId,
    content: content,
    moderation_status: moderationStatus
  });

  if (error) {
    console.error("Roast insert error:", error);
    return { success: false, error: "Failed to submit roast." };
  }

  return { success: true, status: moderationStatus };
}

export async function upvoteRoast(roastId) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { success: false, error: "Must be logged in to upvote." };
  }

  const supabase = getServiceSupabase();

  // Insert upvote (will fail if already upvoted due to unique constraint)
  const { error } = await supabase.from("RoastUpvote").insert({
    user_id: session.user.id,
    roast_id: roastId
  });

  if (error) {
    if (error.code === '23505') { // Unique violation
      return { success: false, error: "You already upvoted this." };
    }
    return { success: false, error: "Failed to upvote." };
  }

  // Increment counter safely
  // Since Supabase RPC for increment isn't set up yet, we'll do a basic read/write
  // For production, create an RPC function: `create function increment_roast(row_id uuid) ...`
  const { data: current } = await supabase.from("Roast").select("upvote_count").eq("id", roastId).single();
  if (current) {
    await supabase.from("Roast").update({ upvote_count: current.upvote_count + 1 }).eq("id", roastId);
  }

  return { success: true };
}
