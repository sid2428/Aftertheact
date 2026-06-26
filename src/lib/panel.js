import { redis } from "@/lib/upstash";

const KEY = "panel:members";

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
    show_in_hero: member.show_in_hero !== false, // legacy entries default to shown
  };
}

// Panel members shown flanking the logo in the hero and rated on /panel.
// Stored as one Redis blob of:
// [{ id, name, image, descriptor, instagram_handle, bio, tags }]
export async function getPanelMembers() {
  try {
    const members = await redis.get(KEY);
    return Array.isArray(members) ? members.map(withId) : [];
  } catch {
    return [];
  }
}

export async function setPanelMembers(members) {
  await redis.set(KEY, members.map(withId));
}

// Create or update one judge. An existing `id` updates that judge in place
// (slug id stays stable, so JudgeRating rows and episode judge_ids keep
// pointing at it). No id = create: the slug is derived from the name and must
// be unique. Returns the normalized saved judge.
export async function upsertPanelMember(member) {
  const members = await getPanelMembers();
  const id = (member.id || "").trim();

  if (id) {
    const idx = members.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error("Judge not found.");
    members[idx] = { ...members[idx], ...member, id };
  } else {
    const newId = slugify(member.name);
    if (!newId) throw new Error("Judge needs a name.");
    if (members.some((m) => m.id === newId)) throw new Error("A judge with that name already exists.");
    members.push({ ...member, id: newId });
  }

  await setPanelMembers(members);
  const saved = await getPanelMembers();
  return saved.find((m) => m.id === (id || slugify(member.name)));
}

export async function deletePanelMember(id) {
  const members = await getPanelMembers();
  await setPanelMembers(members.filter((m) => m.id !== id));
}
