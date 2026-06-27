import { SITE_URL } from "@/lib/seo";

// File-based robots.txt (App Router convention). Served at /robots.txt.
// Allows public crawling, keeps bots out of admin/api/auth and personal pages,
// and points to the sitemap. No UI impact.
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/admin-login",
          "/api/",
          "/login",
          "/onboarding",
          "/my-profile",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
