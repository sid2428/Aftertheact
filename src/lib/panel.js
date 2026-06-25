import { redis } from "@/lib/upstash";

const KEY = "panel:members";
export const MAX_PANEL = 5;

// Default trait tags for a judge — shown as voting options on /panel. Editable
// per judge in the admin panel.
export const DEFAULT_JUDGE_TAGS = [
  "Savage Roaster",
  "Backhanded Praise",
  "Visibly Bored",
  "Overly Generous",
  "Petty Comments",
  "Genuinely Fair",
];

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
  const tags = Array.isArray(member.tags) && member.tags.length > 0 ? member.tags : DEFAULT_JUDGE_TAGS;
  return {
    id,
    name: member.name || "",
    image: member.image || "",
    descriptor: member.descriptor || "",
    instagram_handle: member.instagram_handle || "",
    bio: member.bio || "",
    tags,
  };
}

// Panel members shown flanking the logo in the hero and rated on /panel.
// Stored as one Redis blob of:
// [{ id, name, image, descriptor, instagram_handle, bio, tags }]
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
