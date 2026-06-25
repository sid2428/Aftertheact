import { Bebas_Neue, DM_Sans, Rajdhani } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import MainNav from "@/components/MainNav";

// Three fonts only (UI_ENHANCEMENT_V2 P0.1):
//   Display  — Bebas Neue (headings ≥ 2rem, episode numbers, brand)
//   Body     — DM Sans (prose, labels, inputs)
//   Numbers  — Rajdhani (scores, ranks, vote counts, timestamps)
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-sans" });
const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });
const rajdhani = Rajdhani({ weight: ["500", "600", "700"], subsets: ["latin"], variable: "--font-rajdhani" });

export const metadata = {
  title: "AfterTheAct - IGL Community Platform",
  description: "The independent community platform for India's Got Latent.",
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="%23D4AF37"/><path d="M4 6H20M4 12H12M4 18H8" stroke="%230A0A0A" stroke-width="2" stroke-linecap="round"/><path d="M14 15L17 18L22 10" stroke="%230A0A0A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  },
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className="dark">
      <body className={`${dmSans.variable} ${bebasNeue.variable} ${rajdhani.variable} font-sans bg-[#0A0A0A] text-white min-h-screen flex flex-col selection:bg-latent-crimson/40`}>

        {/* Global Navigation - Dark Luxury Glassmorphic */}
        <MainNav isLoggedIn={!!session?.user} isAdmin={!!session?.user?.isAdmin} />

        {/* Main Content */}
        <main className="flex-1 relative overflow-x-hidden">
          {children}
        </main>

        <footer className="bg-[#111111] mt-20">
          {/* Gold hairline rule */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-latent-gold/40 to-transparent" />
          <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Column 1: brand */}
            <div className="space-y-4">
              <img src="/logo.png" alt="After The Act" className="h-12 w-auto opacity-80" />
              <p className="text-white/50 font-mono text-xs">The show ends. The receipts begin.</p>
            </div>

            {/* Column 2: quick links */}
            <div className="space-y-3">
              <h3 className="font-display font-black uppercase tracking-widest text-white/80 text-sm">Explore</h3>
              <div className="flex flex-col gap-2 font-display font-bold uppercase tracking-widest text-xs text-white/50">
                <Link href="/scoreboard" className="hover:text-latent-gold transition-colors">Verdict Board</Link>
                <Link href="/leaderboard" className="hover:text-latent-gold transition-colors">Prophet&apos;s Wall</Link>
                <Link href="/episodes" className="hover:text-latent-gold transition-colors">The Lineup</Link>
                <Link href="/community" className="hover:text-latent-gold transition-colors">The Green Room</Link>
                <Link href="/panel" className="hover:text-latent-gold transition-colors">Judge the Judges</Link>
              </div>
            </div>

            {/* Column 3: social / legal */}
            <div className="space-y-3">
              <h3 className="font-display font-black uppercase tracking-widest text-white/80 text-sm">The Fine Print</h3>
              <div className="flex flex-col gap-2 font-display font-bold uppercase tracking-widest text-xs text-white/50">
                <span className="text-white/30">Instagram (soon)</span>
                <span className="text-white/30">Twitter / X (soon)</span>
                <p className="text-white/30 font-mono normal-case tracking-normal text-[11px] mt-2 leading-relaxed">
                  Disclaimer: Fan community site. Not affiliated with any official production.
                </p>
                <Link href="/admin-login" className="text-white/20 hover:text-latent-crimson font-mono font-bold transition-colors text-[10px] uppercase tracking-widest mt-2">
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
