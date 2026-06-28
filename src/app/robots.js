// Tells crawlers what to index. Public pages are open; auth/admin/profile and the
// chrome-less voting wheel stay out of the index. Paired with `robots: { index: false }`
// on those routes' metadata as belt-and-suspenders.
const BASE = "https://www.aftertheact.com";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/login", "/onboarding", "/my-profile", "/voting-wheel", "/api/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
