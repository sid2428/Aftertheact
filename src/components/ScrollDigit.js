"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion } from "framer-motion";

const SIZES = {
  md: { item: 44, visible: 3, width: "w-14 sm:w-16", text: "text-2xl" },
  lg: { item: 96, visible: 3, width: "w-28 sm:w-40", text: "text-6xl sm:text-7xl" },
};

let audioCtx;
function playScrollTick() {
  if (typeof window === "undefined") return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    // A very short, woody "tick" sound for the scroll wheel
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.03);
    
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.03);
  } catch (e) {
    // Web Audio not supported or blocked
  }
}

// Vertical scroll-snap number picker — one digit column. Native CSS scroll-snap
// drives the "clicky" feel.
export default function ScrollDigit({ options, value, onChange, disabled, size = "md" }) {
  const { item: ITEM_H, visible, width, text } = SIZES[size];
  const listRef = useRef(null);
  const settleTimer = useRef(null);
  const lastIndex = useRef(options.indexOf(value));

  useEffect(() => {
    // Sync scroll position when value is reset/forced from outside (e.g. integer hits 10).
    const el = listRef.current;
    if (!el) return;
    const idx = Math.max(0, options.indexOf(value));
    lastIndex.current = idx;
    el.scrollTo({ top: idx * ITEM_H, behavior: "auto" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  const commitFromScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const idx = Math.min(Math.max(Math.round(el.scrollTop / ITEM_H), 0), options.length - 1);
    onChange(options[idx]);
  }, [options, onChange, ITEM_H]);

  const handleScroll = () => {
    if (disabled) return;
    
    const el = listRef.current;
    if (el) {
      const idx = Math.min(Math.max(Math.round(el.scrollTop / ITEM_H), 0), options.length - 1);
      // Play tick sound whenever the focused index changes during scroll
      if (idx !== lastIndex.current) {
        lastIndex.current = idx;
        playScrollTick();
      }
    }
    
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(commitFromScroll, 90);
  };

  const handlePick = (opt, idx) => {
    if (disabled) return;
    listRef.current?.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    onChange(opt);
  };

  const totalH = ITEM_H * visible;
  const fadeH = ITEM_H * 0.9;
  const selectedIdx = options.indexOf(value);

  return (
    <div
      className={`relative ${width} select-none ${disabled ? "opacity-30 pointer-events-none" : ""}`}
      style={{ height: totalH }}
    >
      {/* top/bottom fade */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent"
        style={{ height: fadeH }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent"
        style={{ height: fadeH }}
      />

      <div
        ref={listRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none", scrollPaddingTop: ITEM_H, scrollPaddingBottom: ITEM_H }}
      >
        <div style={{ height: ITEM_H }} />
        {options.map((opt, idx) => {
          const isSel = idx === selectedIdx;
          return (
            <motion.div
              key={opt}
              onClick={() => handlePick(opt, idx)}
              animate={{ scale: isSel ? 1.15 : 0.82, opacity: isSel ? 1 : 0.32 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className={`snap-center flex cursor-pointer items-center justify-center font-number font-bold tabular-nums ${text}`}
              style={{ height: ITEM_H, color: isSel ? "#F5D97B" : "rgba(255,255,255,0.55)" }}
            >
              {opt}
            </motion.div>
          );
        })}
        <div style={{ height: ITEM_H }} />
      </div>
    </div>
  );
}
