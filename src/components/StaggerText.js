"use client";

import { motion, useReducedMotion } from "framer-motion";

// Character-by-character reveal for a single line (the contestant name, per
// spec P1.3 — nothing else on the card staggers). The full string stays in the
// accessibility tree via aria-label; the per-char spans are aria-hidden.
const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const child = { hidden: { opacity: 0, y: "0.3em" }, show: { opacity: 1, y: 0 } };

export default function StaggerText({ text = "", className = "" }) {
  const reduced = useReducedMotion();
  if (reduced) return <span className={className}>{text}</span>;

  return (
    <motion.span
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.5 }}
      aria-label={text}
    >
      {Array.from(text).map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          variants={child}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{ display: "inline-block", whiteSpace: "pre" }}
        >
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
    </motion.span>
  );
}
