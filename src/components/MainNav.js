"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, X, User, LogOut, UserCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function AvatarCircle({ userImage, userName }) {
  return (
    <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border-2 border-broadcast-red/60 bg-brand-elevated text-white/80 transition-colors group-hover:border-broadcast-red">
      {userImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={userImage} alt={userName || "Account"} className="h-full w-full object-cover" />
      ) : (
        <User size={18} />
      )}
    </span>
  );
}

export default function MainNav() {
  // Auth state is read on the client so the root layout doesn't need to call
  // getServerSession — that call would force every route to render dynamically
  // and defeat static/ISR caching. See layout.js.
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const isAdmin = !!session?.user?.isAdmin;
  const userName = session?.user?.username || session?.user?.name || session?.user?.email || null;
  const userImage = session?.user?.image || null;

  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [confirmSignout, setConfirmSignout] = useState(false);
  const accountRef = useRef(null);

  // Display labels only — routes/hrefs are unchanged.
  const links = [
    { href: "/scoreboard", label: "Scoreboard" },
    { href: "/leaderboard", label: "The Karma Wall" },
    { href: "/episodes", label: "Episodes" },
    { href: "/community", label: "The Lounge" },
    ...(isLoggedIn ? [{ href: "/panel", label: "Judge the Judges" }] : []),
  ];

  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  // Close the account menu on outside click or Escape.
  useEffect(() => {
    if (!accountOpen) return;
    const onClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setAccountOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  return (
    <>
    <nav className="nav-scroll-reactive sticky top-0 z-50 border-b-4 border-brand-border bg-brand-bg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6">
        {/* Brand */}
        <Link href="/" className="group flex shrink-0 items-center">
          <img src="/logo.png" alt="After The Act" className="h-9 w-auto transition-transform group-hover:-translate-y-0.5 sm:h-12" />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 font-display text-sm font-bold uppercase tracking-widest text-white/70 lg:flex lg:gap-8">
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
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Account: a single avatar circle with a dropdown (My Account / Logout). */}
          {isLoggedIn ? (
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                aria-label="Account menu"
                className="group flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-latent-gold"
              >
                <AvatarCircle userImage={userImage} userName={userName} />
              </button>

              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.14, ease: "easeOut" }}
                    role="menu"
                    className="absolute right-0 z-[70] mt-3 w-52 overflow-hidden rounded-md border border-brand-border bg-brand-panel shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
                  >
                    {userName && (
                      <div className="border-b border-brand-border px-4 py-3">
                        <div className="truncate font-display text-xs font-black uppercase tracking-widest text-white/40">Signed in as</div>
                        <div className="truncate font-display text-sm font-bold text-white">{userName}</div>
                      </div>
                    )}

                    {isAdmin && (
                      <Link
                        href="/admin"
                        role="menuitem"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 font-display text-sm font-bold uppercase tracking-widest text-broadcast-red transition-colors hover:bg-white/5"
                      >
                        Showrunner
                      </Link>
                    )}

                    <Link
                      href="/my-profile"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 font-display text-sm font-bold uppercase tracking-widest text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <UserCircle size={16} className="shrink-0" />
                      My Account
                    </Link>

                    <button
                      onClick={() => { setAccountOpen(false); setConfirmSignout(true); }}
                      role="menuitem"
                      className="flex w-full items-center gap-3 border-t border-brand-border px-4 py-3 text-left font-display text-sm font-bold uppercase tracking-widest text-white/80 transition-colors hover:bg-broadcast-red/10 hover:text-broadcast-red"
                    >
                      <LogOut size={16} className="shrink-0" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/login" aria-label="Log in" className="group flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-latent-gold">
              <AvatarCircle />
            </Link>
          )}

          {/* Mobile hamburger — opens nav links only */}
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="text-white/80 transition-colors hover:text-broadcast-red lg:hidden"
          >
            <Menu size={26} />
          </button>
        </div>
      </div>
    </nav>

      {/* Mobile drawer (nav links) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className="fixed inset-0 z-[60] flex flex-col bg-brand-bg p-6 text-white sm:p-8"
          >
            <div className="flex justify-end">
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-white/80 transition-colors hover:text-broadcast-red">
                <X size={32} />
              </button>
            </div>

            <div className="flex flex-1 flex-col justify-center gap-5 sm:gap-6">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`font-display text-2xl font-black uppercase tracking-widest transition-colors sm:text-3xl ${
                    isActive(l.href) ? "text-broadcast-red" : "text-white/80 hover:text-broadcast-red"
                  }`}
                >
                  {l.label}
                </Link>
              ))}

              <div className="my-3 h-1 w-full bg-white/10" />

              {isLoggedIn ? (
                <>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setOpen(false)} className="font-display text-xl font-black uppercase tracking-widest text-broadcast-red sm:text-2xl">Showrunner</Link>
                  )}
                  <Link href="/my-profile" onClick={() => setOpen(false)} className="font-display text-xl font-black uppercase tracking-widest text-white/80 sm:text-2xl">My Account</Link>
                  <button onClick={() => { setOpen(false); setConfirmSignout(true); }} className="text-left font-display text-xl font-black uppercase tracking-widest text-white/80 sm:text-2xl">Logout</button>
                </>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="font-display text-xl font-black uppercase tracking-widest text-broadcast-red sm:text-2xl">Log In</Link>
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
            <div onClick={(e) => e.stopPropagation()} className="brutal-surface w-full max-w-sm p-6 text-center">
              <div className="mb-2 font-display font-black uppercase tracking-widest text-white">Sign out?</div>
              <p className="mb-6 text-sm text-white/60">You&apos;ll need to sign back in to vote and post.</p>
              <div className="flex justify-center gap-3">
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
