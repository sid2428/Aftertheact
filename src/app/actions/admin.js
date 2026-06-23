"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function createEpisode(data) {
  try {
    await verifyAdmin();
    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from("Episode")
      .insert({
        season_number: parseInt(data.season_number),
        episode_number: parseInt(data.episode_number),
        title: data.title,
        air_date: new Date().toISOString(), // Default to now, can be updated later
        status: "UPCOMING"
      });

    if (error) throw new Error(error.message);

    revalidatePath(`/admin`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Helper to verify admin status
async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    throw new Error("Unauthorized: Admin access required.");
  }
  return true;
}

export async function updateEpisodeStatus(episodeId, status) {
  try {
    await verifyAdmin();
    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from("Episode")
      .update({ status })
      .eq("id", episodeId);

    if (error) throw new Error(error.message);

    revalidatePath(`/episode/${episodeId}`);
    revalidatePath(`/admin`);
    revalidatePath(`/`);
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function triggerRevelation(episodeId) {
  try {
    await verifyAdmin();
    const supabase = getServiceSupabase();

    // In a real app, this would recalculate scores. For now, just mark status as REVEALED
    const { error } = await supabase
      .from("Episode")
      .update({ status: "REVEALED", is_revelation_triggered: true })
      .eq("id", episodeId);

    if (error) throw new Error(error.message);

    revalidatePath(`/episode/${episodeId}`);
    revalidatePath(`/admin`);
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function addContestantToEpisode(episodeId, data) {
  try {
    await verifyAdmin();
    const supabase = getServiceSupabase();

    // 1. Create Contestant
    // Generate slug from name
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
    
    const { data: newContestant, error: contestantError } = await supabase
      .from("Contestant")
      .insert({
        name: data.name,
        slug: slug,
        talent_type: data.talent_type,
        bio: data.bio
      })
      .select("id")
      .single();

    if (contestantError) throw new Error(contestantError.message);

    // 2. Add to Appearance
    const { error: appearanceError } = await supabase
      .from("ContestantEpisodeAppearance")
      .insert({
        contestant_id: newContestant.id,
        episode_id: episodeId,
        judge_average: parseFloat(data.judge_average || 0),
        latent_score: parseFloat(data.latent_score || 0),
        peoples_verdict_weighted: parseFloat(data.peoples_verdict_weighted || 0)
      });

    if (appearanceError) throw new Error(appearanceError.message);

    revalidatePath(`/episode/${episodeId}`);
    revalidatePath(`/admin`);
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
