/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow loading the dev server over the LAN IP (e.g. phone/other machine on the
  // network); Next 16 otherwise blocks cross-origin dev assets (HMR ws, fonts → 403).
  allowedDevOrigins: ["10.253.114.10"],
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  async headers() {
    return [
      {
        // Global security headers on every route. Helmet is Express-only; the Next
        // equivalent is a global headers() entry.
        //   - nosniff: stop MIME-sniffing of responses.
        //   - frame-ancestors 'none' + X-Frame-Options: clickjacking protection.
        //   - HSTS: force HTTPS for a year incl. subdomains (Vercel/edge may also set
        //     this; harmless to assert it here too).
        //   - Referrer-Policy / Permissions-Policy: trim referrer leakage and unused APIs.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Upload filenames are reused slugs (e.g. samay-raina.jpg), not content-hashed — so
        // NOT `immutable`: an in-place replacement must be able to propagate, and a 404 cached
        // before the file was deployed must self-heal instead of sticking for a year. Long edge
        // cache via stale-while-revalidate keeps the perf (served instantly from cache) while
        // a stale entry refreshes on the next background revalidation.
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      {
        // Brand/intro assets in /public otherwise default to `max-age=0` (re-fetched every
        // visit). They're public, non-sensitive, and stable — cache on-device for a week,
        // then serve stale while revalidating so a redesign still propagates. NOT `immutable`:
        // unlike /uploads these keep fixed filenames and can change in place.
        // Listed explicitly so nothing dynamic or sensitive is ever cached by accident.
        source:
          "/:asset(bluecurtains-bg.png|curtains-left.png|curtains-right.png|logo.png|intro.mp4|latent_viral_clip.m4a)",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }],
      },
    ];
  },
  images: {
    remotePatterns: [
      // Google OAuth avatars
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // Supabase Storage (uploaded avatars / images)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
