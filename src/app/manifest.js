import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";

// File-based web app manifest, served at /manifest.webmanifest. Metadata only —
// it controls install/share appearance and is a minor SEO/PWA signal. The theme
// colours mirror the existing dark brand palette so nothing visible changes.
export default function manifest() {
  return {
    name: `${SITE_NAME} — India's Got Latent Community`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0A",
    theme_color: "#0A0A0A",
    icons: [
      { src: "/icon.png", sizes: "any", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
