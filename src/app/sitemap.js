import { getServiceSupabase } from "@/lib/supabase";
import { absoluteUrl } from "@/lib/seo";

// Revalidate the sitemap hourly so newly published episodes get picked up
// without a redeploy.
export const revalidate = 3600;

// Static, publicly-indexable routes. Private/auth/admin routes are intentionally
// excluded (also blocked in robots.js). Login/onboarding/profile are personal.
const STATIC_ROUTES = [
  { path: "/", changeFrequency: "daily", priority: 1.0 },
  { path: "/scoreboard", changeFrequency: "hourly", priority: 0.9 },
  { path: "/leaderboard", changeFrequency: "hourly", priority: 0.8 },
  { path: "/episodes", changeFrequency: "daily", priority: 0.9 },
  { path: "/community", changeFrequency: "hourly", priority: 0.8 },
  { path: "/panel", changeFrequency: "weekly", priority: 0.7 },
  { path: "/judges-scoreboard", changeFrequency: "daily", priority: 0.7 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap() {
  const now = new Date();

  const staticEntries = STATIC_ROUTES.map((r) => ({
    url: absoluteUrl(r.path),
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Pull non-archived episodes for /episode/[id]. Wrapped in try/catch so a
  // missing DB / env var at build time degrades to the static sitemap instead
  // of failing the build.
  let episodeEntries = [];
  try {
    const supabase = getServiceSupabase();
    const { data: episodes } = await supabase
      .from("Episode")
      .select("id, air_date, created_at")
      .neq("status", "ARCHIVED");

    episodeEntries = (episodes || []).map((ep) => ({
      url: absoluteUrl(`/episode/${ep.id}`),
      lastModified: ep.air_date || ep.created_at || now,
      changeFrequency: "daily",
      priority: 0.6,
    }));
  } catch {
    // No DB access at build time — static routes are still emitted.
  }

  return [...staticEntries, ...episodeEntries];
}
