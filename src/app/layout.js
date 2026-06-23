import { Inter, Oswald, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

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
      <body className={`${inter.variable} ${oswald.variable} ${jetbrainsMono.variable} font-sans bg-[#0A0A0A] text-white min-h-screen flex flex-col selection:bg-latent-crimson/40`}>
        
        {/* Global Navigation - Dark Luxury Glassmorphic */}
        <nav className="glass-panel sticky top-0 z-50 border-b border-brand-border">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            
            {/* Brand Identity */}
            <Link href="/" className="flex items-center gap-3 group">
              {/* Brand Symbol (Checkmark/Scorecard Monogram) */}
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-latent-gold-light to-latent-gold flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)] group-hover:shadow-[0_0_20px_rgba(212,175,55,0.6)] transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6H20M4 12H12M4 18H8" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M14 15L17 18L22 10" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-display font-black text-xl tracking-wider uppercase text-white">
                AFTER<span className="text-latent-gold">THE</span>ACT
              </span>
            </Link>
            
            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8 font-display font-bold uppercase tracking-widest text-sm text-white/70">
              <Link href="/scoreboard" className="hover:text-latent-gold transition-colors">Scoreboard</Link>
              <Link href="/leaderboard" className="hover:text-latent-gold transition-colors">Oracle Board</Link>
              <Link href="/" className="hover:text-latent-gold transition-colors">Episodes</Link>
              <Link href="/" className="hover:text-latent-gold transition-colors">Community</Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6">
              {session?.user ? (
                <>
                  {session.user.isAdmin && (
                    <Link href="/admin" className="text-latent-crimson font-display font-bold uppercase text-sm hover:text-white transition-colors">Showrunner</Link>
                  )}
                  <Link href="/my-profile" className="text-white/70 font-display font-bold uppercase text-sm hover:text-white transition-colors">Profile</Link>
                </>
              ) : (
                <Link href="/api/auth/signin" className="bg-gradient-to-r from-latent-gold to-[#B8860B] text-[#0A0A0A] font-display font-black uppercase text-sm tracking-widest px-6 py-2.5 rounded-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all">
                  Join the Jury
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 relative">
          {children}
        </main>

        <footer className="border-t border-brand-border bg-[#111111] py-16 text-center text-sm mt-20">
          <div className="flex justify-center mb-6 opacity-50 grayscale hover:grayscale-0 transition-all">
            <div className="w-6 h-6 rounded-sm bg-latent-gold flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M14 15L17 18L22 10" stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className="font-display font-black uppercase tracking-widest mb-2 text-white/90">AfterTheAct</div>
          <p className="text-white/50 font-mono text-xs">The show ends. The receipts begin.</p>
          <div className="mt-8">
            <Link href="/admin-login" className="text-white/20 hover:text-latent-crimson font-mono font-bold transition-colors text-[10px] uppercase tracking-widest">
              Showrunner Access
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
