import { Anton, Inter, Rajdhani } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import MainNav from "@/components/MainNav";
import SmoothScroll from "@/components/SmoothScroll";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

// Three fonts only:
//   Display  — Anton (headings ≥ 2rem, episode numbers, brand)
//   Body     — Inter (prose, labels, inputs)
//   Numbers  — Rajdhani (scores, ranks, vote counts, timestamps)
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter" });
const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const rajdhani = Rajdhani({ weight: ["500", "600", "700"], subsets: ["latin"], variable: "--font-rajdhani" });

export const metadata = {
  // Resolves all relative metadata URLs (canonical, og:image) against the canonical www host.
  metadataBase: new URL("https://www.aftertheact.com"),
  title: "AfterTheAct - IGL Community Platform",
  description: "The independent community platform for India's Got Latent.",
  alternates: { canonical: "/" },
  // Shared link previews. og:title/og:description are auto-filled per page from each
  // page's title/description; we only set the site-wide constants here.
  openGraph: {
    siteName: "AfterTheAct",
    type: "website",
    locale: "en_IN",
    url: "https://www.aftertheact.com",
    images: ["/logo.png"],
  },
  twitter: { card: "summary_large_image" },
  // Favicon + Apple touch icon come from the file-based convention:
  // src/app/icon.png and src/app/apple-icon.png (the styled "A" from the logo).
};

// Brand entity for search engines. Invisible JSON-LD; describes the site, not page content.
const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AfterTheAct",
  url: "https://www.aftertheact.com",
  description: "The independent community platform for India's Got Latent.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${anton.variable} ${rajdhani.variable} font-sans bg-brand-bg text-white min-h-screen flex flex-col selection:bg-broadcast-red/30`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }} />

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
                <Link href="/scoreboard" className="hover:text-broadcast-red transition-colors">Scoreboard</Link>
                <Link href="/leaderboard" className="hover:text-broadcast-red transition-colors">The Karma Wall</Link>
                <Link href="/episodes" className="hover:text-broadcast-red transition-colors">Episodes</Link>
                <Link href="/community" className="hover:text-broadcast-red transition-colors">The Lounge</Link>
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
