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
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className="light">
      <body className={`${inter.variable} ${oswald.variable} ${jetbrainsMono.variable} font-sans bg-brand-white text-brand-black min-h-screen flex flex-col selection:bg-broadcast-red/30`}>
        
        {/* Global Navigation - High Contrast, Hard Edges */}
        <nav className="border-b-4 border-brand-black bg-white sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="font-display font-black text-2xl tracking-tight uppercase">
              AFTER<span className="text-broadcast-red">THE</span>ACT
            </Link>
            
            <div className="flex items-center gap-6 font-display font-bold uppercase tracking-widest text-brand-black/70">
              <Link href="/scoreboard" className="hover:text-broadcast-red transition-colors">Scoreboard</Link>
              <Link href="/leaderboard" className="hover:text-broadcast-red transition-colors">Leaderboard</Link>
              
              {session?.user ? (
                <>
                  {session.user.isAdmin && (
                    <Link href="/admin" className="text-broadcast-red hover:text-broadcast-dark transition-colors">Admin</Link>
                  )}
                  <Link href="/my-profile" className="text-broadcast-red hover:text-broadcast-dark transition-colors">My Profile</Link>
                </>
              ) : (
                <>
                  <Link href="/admin-login" className="text-brand-black/50 hover:text-broadcast-red transition-colors text-sm">Admin</Link>
                  <Link href="/api/auth/signin" className="bg-brand-black text-white px-4 py-1.5 hover:bg-broadcast-red transition-colors">Login</Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        <footer className="border-t-4 border-brand-black bg-brand-gray py-12 text-center text-sm font-medium mt-20">
          <div className="font-display font-black uppercase tracking-widest mb-2 text-brand-black">AfterTheAct</div>
          <p>An independent community platform. Not affiliated with India's Got Latent.</p>
          <div className="mt-6">
            <Link href="/admin-login" className="text-brand-black/40 hover:text-broadcast-red font-mono font-bold transition-colors text-xs uppercase tracking-widest">
              Showrunner Access
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
