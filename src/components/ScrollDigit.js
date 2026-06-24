"use client";

import { useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

const SIZES = {
  md: { item: 44, visible: 3, width: "w-14 sm:w-16", text: "text-2xl" },
  lg: { item: 88, visible: 3, width: "w-28 sm:w-40", text: "text-6xl sm:text-7xl" },
};

// Vertical scroll-snap number picker — one digit column. Native CSS scroll-snap
// drives the "clicky" feel; we just read the centered item on scroll-settle.
export default function ScrollDigit({ options, value, onChange, disabled, size = "md" }) {
  const { item: ITEM_H, visible, width, text } = SIZES[size];
  const listRef = useRef(null);
  const settleTimer = useRef(null);

  useEffect(() => {
    // Sync scroll position when value is reset/forced from outside (e.g. integer hits 10).
    const el = listRef.current;
    if (!el) return;
    const idx = Math.max(0, options.indexOf(value));
    el.scrollTo({ top: idx * ITEM_H, behavior: "auto" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  const commitFromScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const idx = Math.min(Math.max(Math.round(el.scrollTop / ITEM_H), 0), options.length - 1);
    onChange(options[idx]);
  }, [options, onChange]);

  const handleScroll = () => {
    if (disabled) return;
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(commitFromScroll, 90);
  };

  const handlePick = (opt, idx) => {
    if (disabled) return;
    listRef.current?.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    onChange(opt);
  };

  const totalH = ITEM_H * visible;
  const fadeH = ITEM_H * 0.85;

  return (
    <div className={`relative ${width} select-none ${disabled ? "opacity-30 pointer-events-none" : ""}`} style={{ height: totalH }}>
      {/* center highlight band */}
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 border-y-2 border-latent-gold/60 bg-latent-gold/5 z-10" style={{ height: ITEM_H }} />
      {/* top/bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-[#0A0A0A] to-transparent z-20" style={{ height: fadeH }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0A0A0A] to-transparent z-20" style={{ height: fadeH }} />

      <div
        ref={listRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none", scrollPaddingTop: ITEM_H, scrollPaddingBottom: ITEM_H }}
      >
        <div style={{ height: ITEM_H }} />
        {options.map((opt, idx) => (
          <motion.div
            key={opt}
            whileTap={{ scale: 1.12 }}
            transition={{ duration: 0.12 }}
            onClick={() => handlePick(opt, idx)}
            className={`snap-center flex items-center justify-center font-mono font-black ${text} cursor-pointer`}
            style={{ height: ITEM_H, color: opt === value ? "#D4AF37" : "rgba(255,255,255,0.25)" }}
          >
            {opt}
          </motion.div>
        ))}
        <div style={{ height: ITEM_H }} />
      </div>
    </div>
  );
}
