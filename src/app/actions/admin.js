"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";
import { setPanelMembers, MAX_PANEL } from "@/lib/panel";
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

    if (status === "LIVE") {
      const { count } = await supabase
        .from("ContestantEpisodeAppearance")
        .select("id", { count: "exact", head: true })
        .eq("episode_id", episodeId);
      if (!count) throw new Error("Add at least one contestant before going live.");
    }

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

// --- Form-based management actions (used directly as <form action>) ---

export async function updateEpisode(formData) {
  await verifyAdmin();
  const supabase = getServiceSupabase();
  const id = formData.get("episode_id");
  await supabase.from("Episode").update({
    season_number: parseInt(formData.get("season_number")),
    episode_number: parseInt(formData.get("episode_number")),
    title: formData.get("title"),
    air_date: new Date(formData.get("air_date")).toISOString(),
    admin_note: formData.get("admin_note") || null,
  }).eq("id", id);
  revalidatePath(`/admin/episodes/${id}`);
  revalidatePath(`/episode/${id}`);
}

export async function removeAppearance(formData) {
  await verifyAdmin();
  const supabase = getServiceSupabase();
  const episodeId = formData.get("episode_id");
  await supabase.from("ContestantEpisodeAppearance").delete().eq("id", formData.get("appearance_id"));
  revalidatePath(`/admin/episodes/${episodeId}`);
}

const ACTIVITY_TABLES = { vote: "UserVote", prediction: "UserPrediction", roast: "Roast" };

export async function deleteUserActivity(formData) {
  await verifyAdmin();
  const table = ACTIVITY_TABLES[formData.get("kind")];
  if (!table) throw new Error("Unknown activity type.");
  const supabase = getServiceSupabase();
  await supabase.from(table).delete().eq("id", formData.get("id"));
  revalidatePath(`/admin/users/${formData.get("user_id")}`);
}

export async function updateRoast(formData) {
  await verifyAdmin();
  const supabase = getServiceSupabase();
  await supabase.from("Roast").update({ content: formData.get("content") }).eq("id", formData.get("id"));
  revalidatePath(`/admin/users/${formData.get("user_id")}`);
}

export async function savePanelMembers(formData) {
  await verifyAdmin();
  const members = [];
  for (let i = 0; i < MAX_PANEL; i++) {
    const image = (formData.get(`image_${i}`) || "").trim();
    const name = (formData.get(`name_${i}`) || "").trim();
    if (image || name) members.push({ name, image });
  }
  await setPanelMembers(members);
  revalidatePath("/admin/panel");
  revalidatePath("/");
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
