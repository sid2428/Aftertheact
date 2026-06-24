import { redis } from "@/lib/upstash";

const KEY = "panel:members";
export const MAX_PANEL = 5;

export function slugify(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Ensure every member has a stable id (used to key JudgeRating rows). Legacy
// entries stored as { name, image } get a deterministic slug-based id.
function withId(member) {
  const id = member.id || slugify(member.name) || null;
  return {
    id,
    name: member.name || "",
    image: member.image || "",
    descriptor: member.descriptor || "",
    instagram_handle: member.instagram_handle || "",
    bio: member.bio || "",
  };
}

// Panel members shown flanking the logo in the hero and rated on /panel.
// Stored as one Redis blob of:
// [{ id, name, image, descriptor, instagram_handle, bio }]
export async function getPanelMembers() {
  try {
    const members = await redis.get(KEY);
    return Array.isArray(members) ? members.slice(0, MAX_PANEL).map(withId) : [];
  } catch {
    return [];
  }
}

export async function setPanelMembers(members) {
  await redis.set(KEY, members.slice(0, MAX_PANEL).map(withId));
}
