import { Anton, Inter, Rajdhani } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import MainNav from "@/components/MainNav";
import SmoothScroll from "@/components/SmoothScroll";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  OG_IMAGE,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

// Three fonts only:
//   Display  — Anton (headings ≥ 2rem, episode numbers, brand)
//   Body     — Inter (prose, labels, inputs)
//   Numbers  — Rajdhani (scores, ranks, vote counts, timestamps)
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter" });
const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const rajdhani = Rajdhani({ weight: ["500", "600", "700"], subsets: ["latin"], variable: "--font-rajdhani" });

// All metadata below is head-only — titles, descriptions, canonical/OG/Twitter
// tags and robots directives. None of it renders into the page body, so the
// frontend UI is unchanged.
export const metadata = {
  // Resolves all relative metadata URLs (canonical, OG images) against the live
  // domain. Driven by NEXT_PUBLIC_SITE_URL — see src/lib/seo.js.
  metadataBase: new URL(SITE_URL),
  title: {
    // Used as-is on pages that don't set their own title (e.g. the homepage).
    default: "AfterTheAct — Verdicts, Scores & Community for India's Got Latent",
    // Child page titles become "The Lineup · AfterTheAct", etc.
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "entertainment",
  // NOTE: canonical is intentionally NOT set here. In the App Router, an
  // `alternates.canonical` on the root layout is inherited by every child page,
  // which would point all routes at "/". Each page sets its own canonical via
  // buildMetadata() in src/lib/seo.js instead.
  // Let crawlers index everything public; per-page noindex is applied to private
  // routes (login/onboarding/profile) and robots.txt blocks /admin and /api.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "AfterTheAct — Verdicts, Scores & Community for India's Got Latent",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_IN",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "AfterTheAct — Verdicts, Scores & Community for India's Got Latent",
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  formatDetection: { telephone: false, email: false, address: false },
  manifest: "/manifest.webmanifest",
  // Favicon + Apple touch icon come from the file-based convention:
  // src/app/icon.png and src/app/apple-icon.png (the styled "A" from the logo).
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${anton.variable} ${rajdhani.variable} font-sans bg-brand-bg text-white min-h-screen flex flex-col selection:bg-broadcast-red/30`}>

        {/* Structured data for search engines. <script type="application/ld+json">
            renders nothing visible — it only feeds rich results / knowledge panels. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />

        <SessionProviderWrapper>
          <SmoothScroll>
            {/* Global Navigation - Dark Luxury Glassmorphic */}
            <MainNav />

            {/* Main Content */}
            <main className="flex-1 relative overflow-x-hidden">
              {children}
            </main>
          </SmoothScroll>
        </SessionProviderWrapper>

        <footer className="bg-[#111111] text-brand-white mt-20 border-t-4 border-broadcast-red/60">
          <div className="h-2 w-full bg-broadcast-red" />
          <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Column 1: brand */}
            <div className="space-y-4">
              <img src="/logo.png" alt="After The Act" className="h-12 w-auto opacity-80" />
              <p className="text-brand-white/60 font-mono text-xs">The show ends. The receipts begin.</p>
            </div>

            {/* Column 2: quick links */}
            <div className="space-y-3">
              <h3 className="font-display font-black uppercase tracking-widest text-brand-white text-sm">Explore</h3>
              <div className="flex flex-col gap-2 font-display font-bold uppercase tracking-widest text-xs text-brand-white/60">
                <Link href="/scoreboard" className="hover:text-broadcast-red transition-colors">Verdict Board</Link>
                <Link href="/leaderboard" className="hover:text-broadcast-red transition-colors">Prophet&apos;s Wall</Link>
                <Link href="/episodes" className="hover:text-broadcast-red transition-colors">The Lineup</Link>
                <Link href="/community" className="hover:text-broadcast-red transition-colors">The Green Room</Link>
                <Link href="/panel" className="hover:text-broadcast-red transition-colors">Judge the Judges</Link>
              </div>
            </div>

            {/* Column 3: social / legal */}
            <div className="space-y-3">
              <h3 className="font-display font-black uppercase tracking-widest text-brand-white text-sm">The Fine Print</h3>
              <div className="flex flex-col gap-2 font-display font-bold uppercase tracking-widest text-xs text-brand-white/60">
                <span className="text-brand-white/30">Instagram (soon)</span>
                <span className="text-brand-white/30">Twitter / X (soon)</span>
                <Link href="/terms" className="hover:text-broadcast-red transition-colors">Terms &amp; Privacy</Link>
                <p className="text-brand-white/30 font-mono normal-case tracking-normal text-[11px] mt-2 leading-relaxed">
                  Disclaimer: Fan community site. Not affiliated with any official production.
                </p>
                <Link href="/admin-login" className="text-brand-white/20 hover:text-broadcast-red font-mono font-bold transition-colors text-[10px] uppercase tracking-widest mt-2">
                  Showrunner Access
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
