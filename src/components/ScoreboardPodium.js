"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { Crown } from "lucide-react";

// The "Executioners' Block" — top three, arranged 2 · 1 · 3 on a lit stage.
// Cards tilt toward the pointer, the champion gets a gold shine sweep + crown,
// pedestals rise on reveal, and a one-shot gold confetti burst fires when the
// section scrolls into view (spec: cinematic Dark Luxury).

const TILT_SPRING = { stiffness: 200, damping: 16, mass: 0.5 };

const PLACE_STYLE = {
  1: {
    ring: "border-latent-gold shadow-[0_0_60px_rgba(212,175,55,0.5)]",
    size: "h-40 w-40 border-8 sm:h-60 sm:w-60",
    pedestal: "h-40 sm:h-56 from-latent-gold/25",
    name: "text-2xl text-latent-gold sm:text-4xl",
    score: "text-5xl text-latent-gold drop-shadow-[0_0_20px_rgba(212,175,55,0.6)] sm:text-8xl",
    rankNum: "text-white/40",
    order: "order-2",
    delay: 0.15,
  },
  2: {
    ring: "border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.1)]",
    size: "h-32 w-32 border-[6px] sm:h-48 sm:w-48",
    pedestal: "h-28 sm:h-40 from-white/15",
    name: "text-xl text-white/90 sm:text-3xl",
    score: "text-4xl text-white/90 sm:text-7xl",
    rankNum: "text-white/30",
    order: "order-1",
    delay: 0.3,
  },
  3: {
    ring: "border-latent-crimson/60 shadow-[0_0_30px_rgba(139,30,45,0.3)]",
    size: "h-24 w-24 border-4 sm:h-40 sm:w-40",
    pedestal: "h-20 sm:h-28 from-latent-crimson/20",
    name: "text-lg text-white/70 sm:text-2xl",
    score: "text-3xl text-white/70 sm:text-5xl",
    rankNum: "text-white/20",
    order: "order-3",
    delay: 0.45,
  },
};

function PodiumCard({ entry, place, reduced }) {
  const s = PLACE_STYLE[place];
  const isChamp = place === 1;

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [10, -10]), TILT_SPRING);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-10, 10]), TILT_SPRING);

  function handleMove(e) {
    if (reduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleLeave() {
    px.set(0);
    py.set(0);
  }

  return (
    <div className={`flex flex-col items-center ${s.order}`} style={{ perspective: 1000 }}>
      {/* Rank label */}
      <div className="mb-4 text-center">
        <div className="font-display text-[10px] font-black uppercase tracking-[0.3em] text-white/30 sm:text-sm">Rank</div>
        <div className={`font-display font-black leading-none ${s.rankNum} ${isChamp ? "text-4xl sm:text-6xl" : place === 2 ? "text-3xl sm:text-5xl" : "text-2xl sm:text-4xl"}`}>
          {place}
        </div>
      </div>

      {/* Tilting avatar */}
      <motion.div
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        initial={{ opacity: 0, y: 60, scale: 0.85 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "0px 0px -80px 0px" }}
        transition={reduced ? { duration: 0.2 } : { delay: s.delay, type: "spring", stiffness: 120, damping: 16 }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative"
      >
        {isChamp && (
          <motion.div
            initial={{ y: 8, opacity: 0, rotate: -12 }}
            whileInView={{ y: 0, opacity: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, type: "spring", stiffness: 180 }}
            className="absolute -top-10 left-1/2 z-20 -translate-x-1/2 sm:-top-14"
            style={{ transform: "translateZ(60px)" }}
          >
            <Crown className="h-9 w-9 text-latent-gold drop-shadow-[0_0_12px_rgba(212,175,55,0.8)] sm:h-14 sm:w-14" strokeWidth={2} />
          </motion.div>
        )}

        <div
          className={`relative flex items-center justify-center overflow-hidden rounded-full bg-[#111111] transition-transform duration-500 ${s.ring} ${s.size}`}
          style={{ transform: "translateZ(30px)" }}
        >
          {entry.imageUrl ? (
            <Image src={entry.imageUrl} alt={entry.name} fill sizes="256px" className="object-cover" />
          ) : (
            <span className="font-display text-4xl font-black text-white/20 sm:text-7xl">{entry.name?.[0]}</span>
          )}

          {/* Champion gold shine sweep across the photo. */}
          {isChamp && !reduced && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: "linear-gradient(105deg, transparent 38%, rgba(245,217,123,0.55) 50%, transparent 62%)" }}
              initial={{ x: "-130%" }}
              animate={{ x: "130%" }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
            />
          )}
        </div>
      </motion.div>

      {/* Name + score */}
      <div className={`mt-6 max-w-[140px] truncate font-display font-black uppercase sm:max-w-[240px] ${s.name}`}>
        {entry.name}
      </div>
      <div className={`mt-1 font-number font-black tracking-tighter ${s.score}`}>
        {Number(entry.score).toFixed(1)}
      </div>

      {/* Rising pedestal with a faint top reflection. */}
      <motion.div
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={reduced ? { duration: 0.2 } : { delay: s.delay + 0.2, duration: 0.7, ease: "easeOut" }}
        style={{ originY: 1 }}
        className={`mt-6 w-28 rounded-t-[1.75rem] border-x border-t border-white/10 bg-gradient-to-b to-transparent backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:w-44 ${s.pedestal}`}
      >
        <div className="flex h-full items-start justify-center pt-3 font-display text-3xl font-black text-white/10 sm:text-5xl">
          {place}
        </div>
      </motion.div>
    </div>
  );
}

export default function ScoreboardPodium({ podium = [] }) {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -120px 0px" });
  const fired = useRef(false);

  // One-shot gold confetti and audio snippet when the block reveals. 
  // canvas-confetti touches the DOM, so it's imported lazily.
  useEffect(() => {
    if (!inView || fired.current || reduced) return;
    fired.current = true;
    let cancelled = false;

    // Play viral clip snippet (6s to 10s)
    let audio;
    try {
      audio = new Audio('/latent_viral_clip.m4a');
      audio.currentTime = 6;
      audio.play().catch(() => {}); // Autoplay might be blocked by browser
      setTimeout(() => {
        if (!cancelled && audio) audio.pause();
      }, 4000);
    } catch (e) {}

    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const gold = ["#D4AF37", "#F5D97B", "#B8860B", "#ffffff"];
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors: gold, scalar: 0.9, ticks: 220 });
      setTimeout(() => !cancelled && confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 }, colors: gold }), 220);
      setTimeout(() => !cancelled && confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 }, colors: gold }), 220);
    });
    
    return () => {
      cancelled = true;
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, [inView, reduced]);

  if (!podium.length) return null;

  const ordered = podium.slice(0, 3).map((entry, i) => ({ entry, place: i + 1 }));

  return (
    <section
      ref={ref}
      className="relative mt-12 flex min-h-[70vh] w-full flex-col items-center justify-center overflow-hidden border-t border-white/5 bg-[#050505] py-24"
    >
      {/* Stage glow + sweeping spotlight cones (utilities from globals.css). */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-latent-gold/[0.07] via-transparent to-transparent" />
      <div className="spotlight-cone spot-a left-[12%]" />
      <div className="spotlight-cone spot-b right-[12%]" />

      <div className="relative z-20 w-full max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center font-display text-3xl font-black uppercase tracking-[0.2em] text-white/20 sm:mb-24 sm:text-5xl"
        >
          The Executioners&apos; Block
        </motion.div>

        <div className="flex items-end justify-center gap-6 sm:gap-16">
          {ordered.map(({ entry, place }) => (
            <PodiumCard key={entry.id} entry={entry} place={place} reduced={reduced} />
          ))}
        </div>
      </div>
    </section>
  );
}
