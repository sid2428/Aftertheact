/** @type {import('next').NextConfig} */
const nextConfig = {
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
