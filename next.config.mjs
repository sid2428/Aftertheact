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
        // Upload filenames are reused slugs (e.g. samay-raina.jpg), not content-hashed, and are
        // referenced from DB rows that can go live before the file ships — so NOT `immutable`
        // and no long max-age (a 404 cached before deploy must not stick). Revalidate: the
        // browser keeps the copy but re-checks via ETag every 5 min, so unchanged images return
        // a 0-byte 304 (no re-download of the heavy bytes) while replacements/late files heal
        // within minutes on every device.
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=300, must-revalidate" }],
      },
      {
        // Brand/intro assets in /public otherwise default to `max-age=0` (re-fetched every
        // visit). They're public, non-sensitive, and stable — cache on-device for a week,
        // then serve stale while revalidating so a redesign still propagates. NOT `immutable`:
        // unlike /uploads these keep fixed filenames and can change in place.
        // Listed explicitly so nothing dynamic or sensitive is ever cached by accident.
        source:
          "/:asset(bluecurtains-bg.png|logo.png|intro.mp4|latent_viral_clip.m4a)",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }],
      },
    ];
  },
  images: {
    // Next 16 blocks query strings on local images unless allowlisted (enumeration
    // guard). Uploaded images are cache-busted with version queries (e.g. judge
    // avatars served as ?v=2), so allow any query under /uploads. Defining
    // localPatterns switches to allowlist mode, so every *other* local image must
    // be covered too — hence the no-query catch-all below.
    localPatterns: [
      { pathname: "/uploads/**" }, // omit search → any (or no) query string allowed
      { pathname: "/**", search: "" }, // all other local assets, no query string
    ],
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
