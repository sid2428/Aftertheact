// Static public routes + every non-archived episode, so Google can discover episode
// pages directly (they're also linked in-site). Episodes are fetched at request/build
// time; if the DB is unreachable we still emit the static routes.
import { getServiceSupabase } from "@/lib/supabase";

const BASE = "https://www.aftertheact.com";

const ROUTES = [
  { path: "", priority: 1 },
  { path: "/scoreboard", priority: 0.8 },
  { path: "/leaderboard", priority: 0.8 },
  { path: "/episodes", priority: 0.8 },
  { path: "/community", priority: 0.7 },
  { path: "/panel", priority: 0.7 },

  { path: "/terms", priority: 0.3 },
];

// Re-generate at most hourly — episode list changes rarely and this keeps origin load low.
export const revalidate = 3600;

export default async function sitemap() {
  const lastModified = new Date();

  const staticEntries = ROUTES.map(({ path, priority }) => ({
    url: `${BASE}${path}`,
    lastModified,
    changeFrequency: "daily",
    priority,
  }));

  let episodeEntries = [];
  try {
    const supabase = getServiceSupabase();
    const { data: episodes } = await supabase
      .from("Episode")
      .select("id")
      .neq("status", "ARCHIVED");
    episodeEntries = (episodes || []).map((ep) => ({
      url: `${BASE}/episode/${ep.id}`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.6,
    }));
  } catch {
    // DB unreachable at build/ISR time — ship the static routes rather than failing the sitemap.
  }

  return [...staticEntries, ...episodeEntries];
}
