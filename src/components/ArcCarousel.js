"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import EpisodeCard from "./EpisodeCard";

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

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
      const band = bandRef.current?.getBoundingClientRect();
      if (!band || e.clientY < band.top || e.clientY > band.bottom) return;

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

    const onStart = (e) => {
      const t = e.touches[0];
      lastX = t.clientX;
      lastY = t.clientY;
      horizontal = false;
    };

    const onMove = (e) => {
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

        {/* Invisible vertical band over where the cards render (~centre of the
            stage). The wheel handler only scrubs when the pointer is inside it,
            so the header/empty areas above and below stay free for page scroll.
            pointer-events-none → it never blocks card clicks; used for geometry only. */}
        <div ref={bandRef} aria-hidden className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[560px]" />

        {/* The Arc Track */}
        <div className="relative flex w-full max-w-7xl items-center justify-center">
          {episodes.map((ep, i) => (
            <ArcCard key={ep.id} ep={ep} i={i} total={episodes.length} progress={progress} />
          ))}
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
      className="absolute left-1/2 top-[78%] sm:top-[68%] -ml-[140px] -mt-[220px] w-[280px] h-[440px]"
      // willChange + backfaceVisibility keep each card on its own GPU layer, so
      // the per-frame scale/rotate is a cheap composite instead of a repaint.
      style={{ x: xOffset, y, rotate, scale, opacity, zIndex, willChange: "transform", backfaceVisibility: "hidden" }}
    >
      <EpisodeCard ep={ep} flat className="w-full h-full" innerClassName="shadow-2xl" />
    </motion.div>
  );
}
