"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MainNav({ isLoggedIn = false, isAdmin = false }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [confirmSignout, setConfirmSignout] = useState(false);

  const links = [
    { href: "/scoreboard", label: "Verdict Board" },
    { href: "/leaderboard", label: "Prophet's Wall" },
    { href: "/episodes", label: "Episodes" },
    { href: "/community", label: "The Green Room" },
    ...(isLoggedIn ? [{ href: "/panel", label: "Judge the Judges" }] : []),
  ];

  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
    <nav className="nav-scroll-reactive sticky top-0 z-50 border-b-4 border-brand-border bg-brand-bg">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center group shrink-0">
          <img src="/logo.png" alt="After The Act" className="h-12 w-auto transition-transform group-hover:-translate-y-0.5" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8 font-display font-bold uppercase tracking-widest text-sm text-white/70">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`relative pb-1 transition-colors duration-200 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:bg-broadcast-red after:origin-left after:transition-transform after:duration-200 ${
                isActive(l.href)
                  ? "text-broadcast-red after:scale-x-100"
                  : "hover:text-broadcast-red after:scale-x-0"
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
                  <Link href="/admin" className="text-broadcast-red font-display font-bold uppercase text-sm hover:text-white transition-colors">Showrunner</Link>
                )}
                <Link href="/my-profile" className="text-white/70 font-display font-bold uppercase text-sm hover:text-white transition-colors">Profile</Link>
                <button onClick={() => setConfirmSignout(true)} className="text-white/70 font-display font-bold uppercase text-sm hover:text-broadcast-red transition-colors">Logout</button>
              </>
            ) : (
              <Link href="/api/auth/signin" className="brutal-button font-display font-black uppercase text-sm tracking-widest px-6 py-2.5">
                Join the Jury
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="md:hidden text-white/80 hover:text-broadcast-red transition-colors"
          >
            <Menu size={28} />
          </button>
        </div>
      </div>
    </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-brand-bg text-white flex flex-col p-8"
          >
            <div className="flex justify-end">
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-white/80 hover:text-broadcast-red transition-colors">
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
                    isActive(l.href) ? "text-broadcast-red" : "text-white/80 hover:text-broadcast-red"
                  }`}
                >
                  {l.label}
                </Link>
              ))}

              <div className="h-1 w-full bg-white/10 my-4" />

              {isLoggedIn ? (
                <>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setOpen(false)} className="font-display font-black uppercase tracking-widest text-2xl text-broadcast-red">Showrunner</Link>
                  )}
                  <Link href="/my-profile" onClick={() => setOpen(false)} className="font-display font-black uppercase tracking-widest text-2xl text-white/80">Profile</Link>
                  <button onClick={() => { setOpen(false); setConfirmSignout(true); }} className="text-left font-display font-black uppercase tracking-widest text-2xl text-white/80">Logout</button>
                </>
              ) : (
                <Link href="/api/auth/signin" onClick={() => setOpen(false)} className="font-display font-black uppercase tracking-widest text-2xl text-broadcast-red">Join the Jury</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signout confirm modal */}
      <AnimatePresence>
        {confirmSignout && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-black/80 p-6"
            onClick={() => setConfirmSignout(false)}
          >
            <div onClick={(e) => e.stopPropagation()} className="brutal-surface p-6 max-w-sm w-full text-center">
              <div className="font-display font-black uppercase tracking-widest text-white mb-2">Sign out?</div>
              <p className="text-white/60 text-sm mb-6">You&apos;ll need to sign back in to vote and post.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-primary">Sign Out</button>
                <button onClick={() => setConfirmSignout(false)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
