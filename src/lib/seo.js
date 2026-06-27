// Central SEO config. Everything here is metadata only — it affects what
// crawlers and social scrapers see in <head> / JSON-LD, never the rendered UI.
//
// The canonical domain is read from NEXT_PUBLIC_SITE_URL so the same build can
// be pointed at any custom domain by setting one env var in the host (e.g.
// Vercel → Project → Settings → Environment Variables: NEXT_PUBLIC_SITE_URL =
// https://your-domain). The fallback is only used if that var is unset.
const RAW_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aftertheact.in";

// Normalise: strip any trailing slash so `${SITE_URL}${path}` never doubles up.
export const SITE_URL = RAW_SITE_URL.replace(/\/+$/, "");

export const SITE_NAME = "AfterTheAct";
export const SITE_TAGLINE = "The show ends. The receipts begin.";
export const SITE_DESCRIPTION =
  "AfterTheAct is the independent fan community for India's Got Latent (IGL) — " +
  "score every act, watch the live verdict board reorder in real time, predict " +
  "the winners, and roast the results. Not affiliated with any official production.";

// Broad but honest keyword set. Modern engines largely ignore the meta keywords
// tag, but it's harmless and some niche/social crawlers still read it.
export const SITE_KEYWORDS = [
  "India's Got Latent",
  "IGL",
  "AfterTheAct",
  "After The Act",
  "India's Got Latent community",
  "IGL scoreboard",
  "IGL verdict",
  "IGL voting",
  "IGL episodes",
  "latent comedy",
  "talent show voting",
  "fan community",
  "episode leaderboard",
  "judge the judges",
];

// Default social-share image. Uses the existing brand logo so no new asset or
// UI is introduced; swap to a dedicated 1200×630 OG card later if desired.
export const OG_IMAGE = {
  url: "/logo.png",
  width: 1200,
  height: 630,
  alt: "AfterTheAct — India's Got Latent fan community",
};

// Build an absolute URL from a path. Used for canonical + JSON-LD where some
// consumers require fully-qualified URLs even though metadataBase covers most.
export function absoluteUrl(path = "/") {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

// Per-page metadata helper. Keeps page files to a one-liner while guaranteeing a
// canonical URL, Open Graph and Twitter card on every public route.
//   buildMetadata({ title, description, path })
// `title` is run through the root title template unless `titleAbsolute` is set.
export function buildMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  titleAbsolute = false,
  images = [OG_IMAGE],
  noindex = false,
} = {}) {
  const canonical = path || "/";
  const resolvedTitle = title
    ? titleAbsolute
      ? { absolute: title }
      : title
    : undefined;

  return {
    ...(resolvedTitle ? { title: resolvedTitle } : {}),
    description,
    alternates: { canonical },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: canonical,
      title: title ? (titleAbsolute ? title : `${title} · ${SITE_NAME}`) : undefined,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: title ? (titleAbsolute ? title : `${title} · ${SITE_NAME}`) : undefined,
      description,
      images: images.map((i) => (typeof i === "string" ? i : i.url)),
    },
  };
}

// --- Structured data (JSON-LD) -------------------------------------------------
// Rendered as <script type="application/ld+json"> — invisible to users, read by
// search engines to build rich results / knowledge panels.

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/logo.png"),
    description: SITE_DESCRIPTION,
    slogan: SITE_TAGLINE,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: "After The Act",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
  };
}
