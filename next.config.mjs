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
        // Uploaded filenames are random UUIDs, so caching forever is safe — a new upload is a new URL.
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
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
