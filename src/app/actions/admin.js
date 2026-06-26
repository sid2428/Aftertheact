"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServiceSupabase } from "@/lib/supabase";
import { setPanelMembers, MAX_PANEL } from "@/lib/panel";
import { saveUploadedImage } from "@/lib/uploadImage";
import { revalidatePath } from "next/cache";
import { triggerRevelation as runRevelation } from "@/app/actions/revelation";

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
export async function verifyAdmin() {
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
    const update = { status };

    if (status === "LIVE") {
      const { count } = await supabase
        .from("ContestantEpisodeAppearance")
        .select("id", { count: "exact", head: true })
        .eq("episode_id", episodeId);
      if (!count) throw new Error("Add at least one contestant before going live.");

      const { data: episode } = await supabase
        .from("Episode")
        .select("voting_window_close")
        .eq("id", episodeId)
        .single();
      const revealDeadline = episode?.voting_window_close ? new Date(episode.voting_window_close).getTime() : null;
      if (!revealDeadline || revealDeadline <= Date.now()) {
        update.voting_window_close = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      }
    }

    if (status === "UPCOMING") {
      update.is_revelation_triggered = false;
    }

    const { error } = await supabase
      .from("Episode")
      .update(update)
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
    return await runRevelation(episodeId);
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// --- Form-based management actions (used directly as <form action>) ---

export async function updateEpisode(formData) {
  await verifyAdmin();
  const supabase = getServiceSupabase();
  const id = formData.get("episode_id");

  const update = {
    season_number: parseInt(formData.get("season_number")),
    episode_number: parseInt(formData.get("episode_number")),
    title: formData.get("title"),
    air_date: new Date(formData.get("air_date")).toISOString(),
    admin_note: formData.get("admin_note") || null,
    voting_window_close: formData.get("voting_window_close") ? new Date(formData.get("voting_window_close")).toISOString() : null,
    // Which panel judges (by slug id) appear on this episode.
    judge_ids: formData.getAll("judge_ids"),
  };

  const thumbnailFile = formData.get("thumbnail_file");
  if (thumbnailFile && thumbnailFile.size > 0) {
    update.thumbnail_url = await saveUploadedImage(thumbnailFile, "episodes");
  }

  await supabase.from("Episode").update(update).eq("id", id);
  revalidatePath(`/admin/episodes/${id}`);
  revalidatePath(`/episode/${id}`);
  revalidatePath("/episodes");
  revalidatePath("/panel");
  return { success: true };
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
    const name = (formData.get(`name_${i}`) || "").trim();
    const descriptor = (formData.get(`descriptor_${i}`) || "").trim();
    const instagram_handle = (formData.get(`instagram_${i}`) || "").trim();
    const bio = (formData.get(`bio_${i}`) || "").trim();
    const tags = (formData.get(`tags_${i}`) || "").split(",").map((t) => t.trim()).filter(Boolean);
    const id = (formData.get(`id_${i}`) || "").trim() || undefined;
    const existingImage = (formData.get(`existing_image_${i}`) || "").trim();
    const imageFile = formData.get(`image_${i}`);
    const image = imageFile && imageFile.size > 0 ? await saveUploadedImage(imageFile, "judges") : existingImage;
    if (image || name) members.push({ id, name, image, descriptor, instagram_handle, bio, tags });
  }
  await setPanelMembers(members);
  revalidatePath("/admin/panel");
  revalidatePath("/panel");
  revalidatePath("/");
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
        self_score: parseFloat(data.self_score || 0),
        // latent_score is derived from the crowd verdict at reveal (score_episode_predictions); not admin-set.
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
