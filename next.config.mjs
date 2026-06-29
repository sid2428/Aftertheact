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
        // Uploads use UUID filenames (randomUUID().ext), so a replaced photo
        // naturally gets a new URL. `no-cache` adds a safety net: the browser
        // stores the file locally but always validates via ETag before serving.
        //
        // For unchanged files: 304 Not Modified (~200 bytes, zero egress).
        // For deleted/replaced files: instant 404 or new content — no stale
        // responses stuck in the browser cache.
        //
        // The one round-trip per asset per page load is the cost; on Vercel's
        // edge network this is typically <50ms and the ETag check is ~200 bytes.
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, no-cache" }],
      },
      {
        // Brand/intro assets use fixed filenames and are actively updated (e.g.
        // intro videos get re-cut between episodes).
        //
        // `no-cache` does NOT mean "don't cache". It means:
        //   1. Browser stores the file locally (full cache, no re-download)
        //   2. On every request, sends a conditional GET with the ETag
        //   3. Server returns 304 Not Modified (~200 bytes) if unchanged
        //   4. Server returns 200 + new file if changed (instant propagation)
        //
        // Result: instant updates when you change a video, AND ~99.99% egress
        // savings on unchanged assets (304 vs re-downloading 3MB).
        source:
          "/:asset(bluecurtains-bg.png|logo.png|intro.mp4|vertical.mp4|Horizontal.mp4|latent_viral_clip.m4a)",
        headers: [{ key: "Cache-Control", value: "public, no-cache" }],
      },
    ];
  },
  images: {
    // Next.js image optimizer server-side cache. Matches the upload max-age so
    // optimized variants stay cached as long as the source image does.
    minimumCacheTTL: 86400,
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
