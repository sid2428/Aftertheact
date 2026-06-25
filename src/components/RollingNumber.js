"use client";

import { motion, useReducedMotion } from "framer-motion";

// Each digit rolls upward/downward through intermediate values independently;
// digits that don't change don't move. Used by the leaderboard scores and the
// voting crowd-average strip so both share one motion language (spec P0.3/P0.4).

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

export default function RollingNumber({ value, decimals = 1, height = 48, className = "" }) {
  const reduced = useReducedMotion();
  const num = Number.isFinite(value) ? value : 0;
  const text = num.toFixed(decimals);

  return (
    <span
      className={`inline-flex items-center font-number tabular-nums ${className}`}
      style={{ height, fontSize: height, lineHeight: 1 }}
      aria-label={text}
      role="text"
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
    </span>
  );
}
