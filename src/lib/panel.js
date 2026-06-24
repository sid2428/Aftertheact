import { redis } from "@/lib/upstash";

const KEY = "panel:members";
export const MAX_PANEL = 5;

// Panel members shown flanking the logo in the hero. Stored as one Redis blob:
// [{ name, image }]  (image = URL/path; file upload is deferred).
export async function getPanelMembers() {
  try {
    const members = await redis.get(KEY);
    return Array.isArray(members) ? members.slice(0, MAX_PANEL) : [];
  } catch {
    return [];
  }
}

export async function setPanelMembers(members) {
  await redis.set(KEY, members.slice(0, MAX_PANEL));
}
