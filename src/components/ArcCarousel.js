"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import EpisodeCard from "./EpisodeCard";

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// True when the (full-height) stage sits roughly centred in the viewport — the
// scrub only engages here, so the user always parks the carousel before it
// captures the scroll, and a nudge off-centre hands scrolling back to the page.
const isCentered = (el) => {
  const r = el.getBoundingClientRect();
  return Math.abs(r.top + r.height / 2 - window.innerHeight / 2) < window.innerHeight * 0.14;
};

// An "arc" of episode cards that the viewer scrubs *horizontally* without the
// page scroll being hijacked. The section sits in normal flow (no pin), so a
// vertical scroll carries you straight past it. Horizontal motion is driven
// only when the pointer is over the card band (desktop wheel) or by a sideways
// swipe (mobile) — and it releases to the page once you hit either end. A
// 0→1 `target` MotionValue, smoothed through a spring, feeds the per-card
// transforms below (same arc math as before, just a different input).
export default function ArcCarousel({ episodes = [] }) {
  const reduced = useReducedMotion();
  const sectionRef = useRef(null);
  const bandRef = useRef(null);
  const target = useMotionValue(0);
  const progress = useSpring(target, { stiffness: 100, damping: 30, mass: 0.5 });

  // Desktop: wheel over the card band scrubs the arc; everywhere else (and once
  // we're parked at an end and still pushing outward) the event falls through to
  // Lenis on `window` and scrolls the page. stopPropagation while we capture
  // keeps Lenis from also moving the page underneath us.
  useEffect(() => {
    if (reduced || episodes.length === 0) return;
    const el = sectionRef.current;
    if (!el) return;

    // Full 0→1 sweep costs roughly the same wheel distance the old pinned
    // version reserved, so the scrub speed feels unchanged.
    const span = () => episodes.length * window.innerHeight * 0.8;

    const onWheel = (e) => {
      // Only hijack once the stage has settled to (near) screen centre — until
      // then a vertical scroll carries it there, and a scroll past it leaves.
      if (!isCentered(el)) return;

      const band = bandRef.current?.getBoundingClientRect();
      if (!band || e.clientX < band.left || e.clientX > band.right || e.clientY < band.top || e.clientY > band.bottom) return;

      // Trackpads send horizontal deltas too — follow whichever axis dominates.
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const cur = target.get();
      if ((cur <= 0 && d < 0) || (cur >= 1 && d > 0)) return; // at an end → let the page scroll

      e.preventDefault();
      e.stopPropagation();
      target.set(clamp01(cur + d / span()));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [reduced, episodes.length, target]);

  // Mobile: a horizontal-dominant swipe scrubs the arc (preventDefault to claim
  // the gesture); a vertical swipe is left native, so it scrolls the page past
  // the carousel. Swipe left (dx < 0) lowers progress → cards slide left, so the
  // content tracks the finger.
  useEffect(() => {
    if (reduced || episodes.length === 0) return;
    const el = sectionRef.current;
    if (!el) return;

    const span = () => episodes.length * window.innerHeight * 0.8;
    let lastX = 0;
    let lastY = 0;
    let horizontal = false;
    let inBand = false;

    const onStart = (e) => {
      const t = e.touches[0];
      const band = bandRef.current?.getBoundingClientRect();
      inBand = !!band && t.clientX >= band.left && t.clientX <= band.right && t.clientY >= band.top && t.clientY <= band.bottom;
      lastX = t.clientX;
      lastY = t.clientY;
      horizontal = false;
    };

    const onMove = (e) => {
      // Only scrub when the swipe began inside the glass window and the stage is
      // centred; otherwise the touch falls through to native page scroll.
      if (!inBand || !isCentered(el)) return;

      const t = e.touches[0];
      const dx = t.clientX - lastX;
      const dy = t.clientY - lastY;
      if (!horizontal && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 4) {
        horizontal = true;
      }
      if (horizontal) {
        e.preventDefault();
        target.set(clamp01(target.get() + (dx * 1.6) / span()));
        lastX = t.clientX;
        lastY = t.clientY;
      }
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
    };
  }, [reduced, episodes.length, target]);

  if (!episodes || episodes.length === 0) return null;

  // ── Reduced-motion fallback: a plain horizontal, snap-scrolling row ───────
  if (reduced) {
    return (
      <section className="relative bg-[#0A0A0A] py-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-12">
          <ArcHeader />
          <div className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 no-scrollbar">
            {episodes.map((ep) => (
              <div key={ep.id} className="w-[280px] shrink-0 snap-center">
                <EpisodeCard ep={ep} reduced className="h-full" innerClassName="shadow-2xl" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative isolate bg-[#0A0A0A] overflow-x-clip">
      <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden">
        {/* Header — sits above the cards (centered card reaches zIndex 100) so the
            title stays visible; pointer-events-none so it never intercepts card clicks. */}
        <div className="pointer-events-none absolute top-4 md:top-8 left-0 right-0 z-[110] text-center px-4">
          <ArcHeader />
        </div>

        {/* Invisible hit-zone matching the glass window. The scrub only engages
            when the pointer/touch is inside it, so every edge — top, bottom,
            left, right — stays free for page scroll. pointer-events-none → it
            never blocks card clicks; used for geometry only. */}
        <div ref={bandRef} aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[92vw] sm:h-[560px] sm:w-[min(92vw,1040px)]" />

        {/* The window — clips the line-up to the frame, so episodes queued to the
            left and right stay hidden until you scrub them in. Cards center
            inside it; the arc fans them down-and-out past the rounded edge. */}
        <div className="absolute left-1/2 top-1/2 z-[1] h-[500px] w-[92vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] sm:h-[560px] sm:w-[min(92vw,1040px)]">
          <div className="relative h-full w-full">
            {episodes.map((ep, i) => (
              <ArcCard key={ep.id} ep={ep} i={i} total={episodes.length} progress={progress} />
            ))}
          </div>
        </div>

        {/* Liquid-glass trim on top of the window — an elevated, translucent
            boundary that shows the eye where horizontal scrubbing lives. The
            side fades hint at "more beyond"; the rail fills 0→1 — pinned empty
            or full means you're at an end and further scroll releases to the
            page. pointer-events-none so it never blocks card clicks. */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[105] h-[500px] w-[92vw] -translate-x-1/2 -translate-y-1/2 sm:h-[560px] sm:w-[min(92vw,1040px)]">
          <div className="absolute inset-0 rounded-[2rem] border border-latent-gold/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_0_70px_rgba(212,175,55,0.05),0_40px_120px_rgba(0,0,0,0.55)]" />

          {/* Edge fades: blur + darken cards drifting out each side. */}
          <div className="absolute inset-y-0 left-0 w-16 rounded-l-[2rem] bg-gradient-to-r from-[#0A0A0A] to-transparent backdrop-blur-[2px] [mask-image:linear-gradient(to_right,black,transparent)] sm:w-24" />
          <div className="absolute inset-y-0 right-0 w-16 rounded-r-[2rem] bg-gradient-to-l from-[#0A0A0A] to-transparent backdrop-blur-[2px] [mask-image:linear-gradient(to_left,black,transparent)] sm:w-24" />

          {/* Scrub rail — the explicit scroll-limit indicator. */}
          <div className="absolute bottom-5 left-1/2 h-1 w-40 -translate-x-1/2 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full origin-left rounded-full bg-gradient-to-r from-latent-gold to-latent-crimson" style={{ scaleX: progress }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ArcHeader() {
  return (
    <div className="flex flex-col items-center gap-1.5 sm:gap-3">
      {/* Label */}
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-latent-crimson/40 bg-latent-crimson/10 font-display text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-latent-crimson/80">
        <span className="w-1.5 h-1.5 rounded-full bg-latent-crimson animate-pulse" />
        Season Arc
      </span>

    </div>
  );
}

function ArcCard({ ep, i, total, progress }) {
  // Where this card sits along the 0→1 timeline when it's the centered card.
  const centerProgress = total > 1 ? i / (total - 1) : 0.5;

  const CARD_WIDTH = 320; // horizontal spread between adjacent cards
  const trackWidth = (total > 1 ? total - 1 : 1) * CARD_WIDTH;

  // Scrolling down (increasing progress) slides cards to the right.
  const xOffset = useTransform(progress, (p) => (p - centerProgress) * trackWidth);

  // Distance from centre, in card "slots", drives the arc shape + emphasis.
  const distance = useTransform(progress, (p) => (centerProgress - p) * (total > 1 ? total - 1 : 1));

  const y = useTransform(distance, (d) => Math.pow(d, 2) * 60); // parabola
  const rotate = useTransform(distance, (d) => d * 18);
  const scale = useTransform(distance, [-3, -1, 0, 1, 3], [0.6, 0.8, 1.15, 0.8, 0.6]);
  const opacity = useTransform(distance, [-3, -1.5, 0, 1.5, 3], [0, 0.4, 1, 0.4, 0]);
  const zIndex = useTransform(distance, (d) => 100 - Math.round(Math.abs(d) * 10));

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 -ml-[140px] -mt-[220px] w-[280px] h-[440px]"
      // willChange + backfaceVisibility keep each card on its own GPU layer, so
      // the per-frame scale/rotate is a cheap composite instead of a repaint.
      style={{ x: xOffset, y, rotate, scale, opacity, zIndex, willChange: "transform", backfaceVisibility: "hidden" }}
    >
      <EpisodeCard ep={ep} flat className="w-full h-full" innerClassName="shadow-2xl" />
    </motion.div>
  );
}
