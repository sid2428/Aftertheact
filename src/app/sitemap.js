// Static public routes only — episode pages are discovered via in-site links and are
// excluded here by choice (sitemap scope: static pages). Cached by Next as a static
// route; lastModified reflects build time, which is fine for these stable pages.
const BASE = "https://www.aftertheact.com";

const ROUTES = [
  { path: "", priority: 1 },
  { path: "/scoreboard", priority: 0.8 },
  { path: "/leaderboard", priority: 0.8 },
  { path: "/episodes", priority: 0.8 },
  { path: "/community", priority: 0.7 },
  { path: "/panel", priority: 0.7 },
  { path: "/judges-scoreboard", priority: 0.6 },
  { path: "/terms", priority: 0.3 },
];

export default function sitemap() {
  const lastModified = new Date();
  return ROUTES.map(({ path, priority }) => ({
    url: `${BASE}${path}`,
    lastModified,
    changeFrequency: "daily",
    priority,
  }));
}
