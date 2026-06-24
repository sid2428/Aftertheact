"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MainNav({ isLoggedIn = false, isAdmin = false }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/scoreboard", label: "Verdict Board" },
    { href: "/leaderboard", label: "Prophet's Wall" },
    { href: "/episodes", label: "Episodes" },
    { href: "/community", label: "The Green Room" },
    ...(isLoggedIn ? [{ href: "/panel", label: "Judge the Judges" }] : []),
  ];

  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="glass-panel sticky top-0 z-50 border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center group shrink-0">
          <img src="/logo.png" alt="After The Act" className="h-12 w-auto drop-shadow-[0_0_15px_rgba(212,175,55,0.2)] group-hover:drop-shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8 font-display font-bold uppercase tracking-widest text-sm text-white/70">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`relative pb-1 border-b-2 transition-all duration-200 ${
                isActive(l.href)
                  ? "text-latent-gold border-latent-gold"
                  : "border-transparent hover:text-latent-gold"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            {isLoggedIn ? (
              <>
                {isAdmin && (
                  <Link href="/admin" className="text-latent-crimson font-display font-bold uppercase text-sm hover:text-white transition-colors">Showrunner</Link>
                )}
                <Link href="/my-profile" className="text-white/70 font-display font-bold uppercase text-sm hover:text-white transition-colors">Profile</Link>
                <Link href="/api/auth/signout?callbackUrl=/" className="text-white/70 font-display font-bold uppercase text-sm hover:text-latent-crimson transition-colors">Logout</Link>
              </>
            ) : (
              <Link href="/api/auth/signin" className="bg-gradient-to-r from-latent-gold to-[#B8860B] text-[#0A0A0A] font-display font-black uppercase text-sm tracking-widest px-6 py-2.5 rounded-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all">
                Join the Jury
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="md:hidden text-white/80 hover:text-latent-gold transition-colors"
          >
            <Menu size={28} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-[#080808] flex flex-col p-8"
          >
            <div className="flex justify-end">
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-white/80 hover:text-latent-crimson transition-colors">
                <X size={32} />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-6">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`font-display font-black uppercase tracking-widest text-3xl transition-colors ${
                    isActive(l.href) ? "text-latent-gold" : "text-white/80 hover:text-latent-gold"
                  }`}
                >
                  {l.label}
                </Link>
              ))}

              <div className="h-px w-full bg-white/10 my-4" />

              {isLoggedIn ? (
                <>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setOpen(false)} className="font-display font-black uppercase tracking-widest text-2xl text-latent-crimson">Showrunner</Link>
                  )}
                  <Link href="/my-profile" onClick={() => setOpen(false)} className="font-display font-black uppercase tracking-widest text-2xl text-white/80">Profile</Link>
                  <Link href="/api/auth/signout?callbackUrl=/" onClick={() => setOpen(false)} className="font-display font-black uppercase tracking-widest text-2xl text-white/80">Logout</Link>
                </>
              ) : (
                <Link href="/api/auth/signin" onClick={() => setOpen(false)} className="font-display font-black uppercase tracking-widest text-2xl text-latent-gold">Join the Jury</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
