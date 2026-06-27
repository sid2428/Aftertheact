"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Each digit rolls upward/downward through intermediate values independently;
// digits that don't change don't move. Used by the leaderboard scores and the
// verdict reveal so both share one motion language (spec P0.3/P0.4).

const DIGIT_SPRING = { type: "spring", stiffness: 260, damping: 30, mass: 0.6 };

function RollingDigit({ digit, height, reduced }) {
  if (reduced) {
    return (
      <span className="inline-block text-center" style={{ height, lineHeight: `${height}px`, width: "0.6em" }}>
        {digit}
      </span>
    );
  }
  return (
    <span className="relative inline-block overflow-hidden align-top" style={{ height, width: "0.6em" }} aria-hidden>
      <motion.span
        className="absolute left-0 top-0 flex w-full flex-col items-center"
        animate={{ y: -digit * height }}
        transition={DIGIT_SPRING}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="block w-full text-center" style={{ height, lineHeight: `${height}px` }}>
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

// `suspense` turns the count-up into a "KBC Audience Poll" reveal: when the
// number first scrolls into view it flickers through random plausible values,
// decelerating, then locks onto the real value with a distinct landing beat.
// It runs once per mount (replays on a fresh page load, never restarts when the
// card scrolls out and back). `headline` gives the landing a more pronounced pop.
export default function RollingNumber({
  value,
  decimals = 1,
  height = 48,
  className = "",
  suspense = false,
  suspenseDuration = 2000,
  headline = false,
}) {
  const reduced = useReducedMotion();
  const num = Number.isFinite(value) ? value : 0;
  const ref = useRef(null);
  const playedRef = useRef(false);
  const [display, setDisplay] = useState(num);
  const [suspending, setSuspending] = useState(false);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    if (!suspense || reduced) return;
    const el = ref.current;
    if (!el) return;

    let cancelled = false;
    let timer;

    const run = () => {
      if (playedRef.current) return;
      playedRef.current = true;
      setSuspending(true);
      const start = performance.now();
      // Random values stay above zero and in a band that narrows toward the real
      // number as time runs out, so it reads as "homing in" rather than noise.
      const band = Math.max(num * 0.85, num > 10 ? 12 : 4);

      const tick = () => {
        if (cancelled) return;
        const t = Math.min(1, (performance.now() - start) / suspenseDuration);
        if (t >= 1) {
          setSuspending(false);
          setLanded(true);
          return;
        }
        const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic — converge + decelerate
        const spread = (1 - ease) * band;
        setDisplay(Math.max(0, num + (Math.random() * 2 - 1) * spread));
        // Flicker fast early (~45ms), slow to ~420ms near the end.
        timer = setTimeout(() => requestAnimationFrame(tick), 45 + ease * 375);
      };
      requestAnimationFrame(tick);
    };

    // Start the reveal the moment the score actually enters the viewport, so it's
    // always seen rather than burning out while the card is still off-screen.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      io.disconnect();
    };
  }, [suspense, reduced, num, suspenseDuration]);

  const shown = suspending ? display : num;
  const text = (Number.isFinite(shown) ? shown : 0).toFixed(decimals);
  const landKeyframes = headline ? { scale: [1, 1.22, 1] } : { scale: [1, 1.09, 1] };

  return (
    <motion.span
      ref={ref}
      className={`inline-flex items-center font-number tabular-nums ${className}`}
      style={{ height, fontSize: height, lineHeight: 1 }}
      aria-label={text}
      role="text"
      animate={landed && !reduced ? landKeyframes : { scale: 1 }}
      transition={{ duration: headline ? 0.7 : 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {text.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          <RollingDigit key={i} digit={Number(ch)} height={height} reduced={reduced} />
        ) : (
          <span key={i} className="inline-block text-center" style={{ height, lineHeight: `${height}px`, width: "0.32em" }}>
            {ch}
          </span>
        )
      )}
    </motion.span>
  );
}
