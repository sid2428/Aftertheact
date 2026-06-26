import { Anton, Inter, Rajdhani } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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
      <body className={`${inter.variable} ${anton.variable} ${rajdhani.variable} font-sans bg-brand-bg text-white min-h-screen flex flex-col selection:bg-broadcast-red/30`}>

        <SessionProviderWrapper session={session}>
          <SmoothScroll>
            {/* Global Navigation - Dark Luxury Glassmorphic */}
            <MainNav
              isLoggedIn={!!session?.user}
              isAdmin={!!session?.user?.isAdmin}
              userName={session?.user?.username || session?.user?.name || session?.user?.email || null}
              userImage={session?.user?.image || null}
            />

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
