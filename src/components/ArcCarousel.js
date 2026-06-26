"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, useReducedMotion } from "framer-motion";
import EpisodeCard from "./EpisodeCard";
import TypeOnce from "./TypeOnce";

// A scroll-driven "arc" of episode cards: while the section is pinned, scrolling
// slides the cards left→right along a shallow parabola, each becoming the
// centered, largest card in turn. Pinning + scroll progress are owned by GSAP
// ScrollTrigger (pin: true uses fixed positioning, so it holds even though an
// ancestor uses overflow-x-hidden, and it stays in sync with the global Lenis
// smooth-scroll). The progress feeds Framer MotionValues that transform each card.
export default function ArcCarousel({ episodes = [] }) {
  const reduced = useReducedMotion();
  const sectionRef = useRef(null);
  const pinRef = useRef(null);
  const progress = useMotionValue(0);

  useEffect(() => {
    if (reduced || episodes.length === 0) return;
    let cancelled = false;
    let ctx;

    (async () => {
      const { default: gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled || !sectionRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top top",
          // Pin long enough to step through every card, then release cleanly
          // (pinSpacing reserves exactly this much runway — no black gap after).
          end: () => "+=" + episodes.length * window.innerHeight * 0.8,
          pin: pinRef.current,
          pinSpacing: true,
          // A small scrub lag lerps progress toward the scroll position instead
          // of snapping to it, so variable-rate touch-scroll events on mobile
          // resolve into fluid motion rather than frame-to-frame jitter.
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => progress.set(self.progress),
        });
      }, sectionRef);

      ScrollTrigger.refresh();
    })();

    return () => {
      cancelled = true;
      if (ctx) ctx.revert();
    };
  }, [reduced, episodes.length, progress]);

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
    <section ref={sectionRef} className="relative bg-[#0A0A0A]">
      <div ref={pinRef} className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden">
        {/* Header — sits above the cards (centered card reaches zIndex 100) so the
            title stays visible; pointer-events-none so it never intercepts card clicks. */}
        <div className="pointer-events-none absolute top-6 md:top-12 left-0 right-0 z-[110] text-center px-4">
          <ArcHeader />
        </div>

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
    <h2 className="font-display text-3xl uppercase tracking-widest text-white sm:text-4xl">
      <TypeOnce text="Live To Locked" sessionKey="hero-live-to-locked" speed={60} />
    </h2>
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
      className="absolute left-1/2 top-[52%] -ml-[140px] -mt-[220px] w-[280px] h-[440px]"
      // willChange + backfaceVisibility keep each card on its own GPU layer, so
      // the per-frame scale/rotate is a cheap composite instead of a repaint.
      style={{ x: xOffset, y, rotate, scale, opacity, zIndex, willChange: "transform", backfaceVisibility: "hidden" }}
    >
      <EpisodeCard ep={ep} flat className="w-full h-full" innerClassName="shadow-2xl" />
    </motion.div>
  );
}
