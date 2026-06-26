"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";

// The one deliberate WebGL atmosphere layer (see brief §5). Client-only — the
// R3F canvas has nothing to render on the server.
const HeroAtmosphere = dynamic(() => import("./HeroAtmosphere"), { ssr: false });

// Fixed side slots, kept clear of the center column (logo) and the bottom CTA band.
const SIDE_SLOTS = {
  left: { x: "12%", y: "46%", tilt: -5 },
  right: { x: "88%", y: "46%", tilt: 5 },
};

const CYCLE_MS = 3500;

// Monotonic counter ticking on an interval; pauses if there's nothing to cycle.
// Monotonic (not modulo'd) so the per-tick value can double as a z-index — each
// incoming face sits above the one it replaces, including across the wrap.
function useCycle(length) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (length <= 1) return;
    const id = setInterval(() => setTick((t) => t + 1), CYCLE_MS);
    return () => clearInterval(id);
  }, [length]);
  return tick;
}

// Desktop side face. The outgoing face exits fast while the incoming one (higher
// z) pops in at delay 0 with a subtle spring overshoot — they overlap by a frame
// or two, so the swap reads as "old gone, new bounces in" with no blank gap.
function Face({ member, delay, slot, z }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.28, rotate: slot.tilt }}
      animate={{ opacity: 1, scale: 1.4, rotate: slot.tilt }}
      exit={{ opacity: 0, scale: 1.3, transition: { duration: 0.2, ease: "easeIn" } }}
      whileHover={{ rotate: 0, scale: 1.8 }}
      transition={{
        delay,
        type: "spring",
        stiffness: 240,
        damping: 14, // subtle single overshoot ≈ the "bounce"
        opacity: { delay, duration: 0.28, ease: "easeOut" },
      }}
      className="group absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: slot.x, top: slot.y, zIndex: z }}
    >
      {/* Tooltip on hover */}
      <div className="pointer-events-none absolute top-3 left-1/2 z-30 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-sm border border-latent-gold/30 bg-[#111111] px-3 py-1.5 text-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="font-display font-black uppercase text-xs text-white tracking-widest">{member.name}</div>
        {member.descriptor && (
          <div className="font-mono text-[10px] uppercase tracking-widest text-latent-gold">{member.descriptor}</div>
        )}
      </div>

      <div className="relative w-32 h-44 md:w-44 md:h-60 lg:w-56 lg:h-80 transition-transform duration-300 group-hover:scale-105">
        {member.image ? (
          <Image
            src={member.image}
            alt={member.name || ""}
            fill
            sizes="224px"
            className="object-contain object-bottom drop-shadow-[0_0_14px_rgba(212,175,55,0.35)] group-hover:drop-shadow-[0_0_22px_rgba(212,175,55,0.6)] transition-[filter] duration-300"
          />
        ) : (
          <span className="font-display font-black text-3xl text-white/20">{member.name?.[0] || "?"}</span>
        )}
      </div>
    </motion.div>
  );
}

// Mobile-only stage: full-width logo (revealed instantly as the curtains part)
// over a single deck of judge photos that deal in from off-screen and settle
// into a fanned stack — like cards — when scrolled into view. No infinite loop.
function MobileStage({ members }) {
  const n = members.length;
  return (
    <div className="md:hidden relative z-10 flex flex-col items-center w-full px-4">
      <motion.img
        src="/logo.png"
        alt="After The Act"
        className="w-[94vw] max-w-none h-auto transform-gpu"
        initial={{ opacity: 1 }}
      />

      <div className="relative mt-4 flex w-full justify-center" style={{ height: "16rem" }}>
        {members.map((m, i) => {
          const center = (n - 1) / 2;
          return (
            <motion.div
              key={m.id || i}
              className="absolute top-0"
              style={{ zIndex: i }}
              initial={{ x: i % 2 ? "120vw" : "-120vw", rotate: i % 2 ? 22 : -22, opacity: 0 }}
              whileInView={{ x: (i - center) * 30, y: i * 6, rotate: (i - center) * 7, opacity: 1 }}
              viewport={{ once: false, amount: 0.4 }}
              transition={{ delay: i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative w-40 h-56">
                {m.image && (
                  <Image
                    src={m.image}
                    alt={m.name || ""}
                    fill
                    sizes="160px"
                    className="object-contain object-bottom drop-shadow-[0_0_14px_rgba(212,175,55,0.35)]"
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function CurtainHero({ members = [] }) {
  // Only judges flagged for the hero, and only ones with a photo to show.
  const heroMembers = members.filter((m) => m.show_in_hero !== false && m.image);

  const tick = useCycle(heroMembers.length);
  const len = heroMembers.length;
  const idx = len ? tick % len : 0;
  const half = Math.ceil(len / 2) || 1;
  const leftMember = len ? heroMembers[idx] : null;
  const rightMember = len ? heroMembers[(idx + half) % len] : null;

  return (
    <div
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 80%, rgba(139,30,45,0.15) 0%, transparent 60%), radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 50%), url('/bluecurtains-bg.png') center/cover",
      }}
    >
      {/* Volumetric golden atmosphere — sits behind everything, never blocks UI */}
      <HeroAtmosphere className="pointer-events-none absolute inset-0 z-0" />

      <div className="spotlight-cone spot-a" style={{ left: "12%" }} />
      <div className="spotlight-cone spot-b" style={{ right: "12%" }} />

      {/* Desktop: one judge face per side, cycling through the roster (hidden on mobile) */}
      <div className="hidden md:block">
        <AnimatePresence mode="popLayout">
          {leftMember && <Face key={`l-${tick}`} member={leftMember} delay={tick === 0 ? 1.6 : 0} slot={SIDE_SLOTS.left} z={tick} />}
          {rightMember && <Face key={`r-${tick}`} member={rightMember} delay={tick === 0 ? 1.75 : 0} slot={SIDE_SLOTS.right} z={tick} />}
        </AnimatePresence>
      </div>

      {/* Desktop logo: centered on its own, unaffected by the scatter above */}
      <div className="hidden md:flex relative z-10 items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative shrink-0"
        >
          {/* pulsing logo halo */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-latent-gold/20 blur-[80px] rounded-full"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />
          {/* The looping scale stays on a bare image (no filter) so it's a pure
              GPU composite every frame. The gold glow comes from the static halo
              above — keeping a drop-shadow here would force the filter to
              re-rasterize on every frame of the infinite scale, which tanks the
              hero's frame rate on mobile. */}
          <motion.img
            src="/logo.png"
            alt="After The Act"
            className="relative w-[53vw] max-w-none h-auto transform-gpu"
            style={{ willChange: "transform", backfaceVisibility: "hidden" }}
            animate={{ scale: [1, 1.25, 1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, times: [0, 0.15, 0.3, 0.45, 1] }}
          />
        </motion.div>
      </div>

      {/* Mobile stage: instant full-width logo + scroll-dealt card deck */}
      <MobileStage members={heroMembers} />

      {/* CTAs revealed after the curtains open */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.9, duration: 0.6 }}
        className="absolute bottom-24 z-10 flex flex-col sm:flex-row justify-center gap-6 px-6 w-full max-w-4xl"
      >
        <Link href="/api/auth/signin" className="relative group overflow-hidden flex-1 text-center bg-[#120f02] text-latent-gold font-display font-black uppercase tracking-[0.25em] px-8 sm:px-10 py-5 sm:py-6 text-lg sm:text-xl shadow-[4px_4px_0px_0px_#8B1E2D] hover:shadow-[8px_8px_0px_0px_#E53935] hover:-translate-y-1 transition-all duration-500 rounded-none border-4 border-latent-gold">
          <span className="relative z-10 transition-colors duration-500">Join the Jury</span>
          <div className="absolute inset-0 bg-latent-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
        </Link>
        <Link href="/scoreboard" className="relative group overflow-hidden flex-1 text-center bg-[#050505]/60 backdrop-blur-xl text-white font-display font-black uppercase tracking-[0.25em] px-8 sm:px-10 py-5 sm:py-6 text-lg sm:text-xl border border-white/20 hover:border-latent-gold hover:text-latent-gold shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_50px_rgba(212,175,55,0.3)] hover:-translate-y-1 transition-all duration-500 rounded-none">
          <span className="relative z-10">Explore Scoreboard</span>
          <div className="absolute inset-0 bg-latent-gold/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
        </Link>
      </motion.div>

      {/* Reflective stage floor */}
      <div className="absolute bottom-0 left-0 w-full h-[15%] bg-gradient-to-t from-latent-gold/5 to-transparent pointer-events-none z-[5]" />

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 1 }}
      >
        <span className="text-[10px] font-display font-black uppercase tracking-widest text-white/30">Scroll</span>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-latent-gold"><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>
        </motion.div>
      </motion.div>

      {/* Red velvet curtains — flick and bounce open from the middle */}
      <motion.img
        src="/curtains-left.png"
        alt=""
        initial={{ x: "0%" }}
        animate={{ x: "-101%" }}
        transition={{ delay: 0.3, duration: 1.7, ease: "anticipate" }}
        className="absolute top-0 left-0 h-full w-[52%] object-cover z-20 pointer-events-none"
      />
      <motion.img
        src="/curtains-right.png"
        alt=""
        initial={{ x: "0%" }}
        animate={{ x: "101%" }}
        transition={{ delay: 0.3, duration: 1.7, ease: "anticipate" }}
        className="absolute top-0 right-0 h-full w-[52%] object-cover z-20 pointer-events-none"
      />
    </div>
  );
}
