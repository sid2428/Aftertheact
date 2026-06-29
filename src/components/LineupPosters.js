"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import ResilientImg from "./ResilientImg";

// The fanned trio of posters to the right of the "THE LINEUP" headline. Each
// slot holds a frame that morphs through the episode list on a stagger — the
// outgoing poster blurs + scales away while the incoming one resolves into
// focus, so the deck feels alive without ever leaving its three angled slots.
const ROTATIONS = [-5, 0, 5];
const MORPH = { duration: 0.9, ease: [0.22, 1, 0.36, 1] };

function Poster({ ep }) {
  return (
    <>
      {ep.thumbnail_url ? (
        <ResilientImg src={ep.thumbnail_url} alt={ep.title} fallbackLetter={`E${ep.episode_number}`} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#1a1a1a] to-[#050505]">
          <span className="font-display text-5xl font-black text-white/10">E{ep.episode_number}</span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <div className="truncate font-display text-[10px] font-black uppercase tracking-widest text-white/80">
          {ep.title}
        </div>
      </div>
    </>
  );
}

export default function LineupPosters({ episodes = [] }) {
  const reduced = useReducedMotion();
  const [tick, setTick] = useState(0);

  const pool = episodes.filter(Boolean);

  // Advance one slot every couple of seconds; each slot reads a different
  // offset into the pool so the three frames never show the same episode.
  useEffect(() => {
    if (reduced || pool.length <= 3) return;
    const id = setInterval(() => setTick((t) => t + 1), 2600);
    return () => clearInterval(id);
  }, [reduced, pool.length]);

  if (pool.length === 0) return null;

  return (
    <div className="hidden gap-4 md:flex mt-8 lg:mt-12">
      {ROTATIONS.map((rotate, slot) => {
        const ep = pool[(tick + slot) % pool.length];
        return (
          <motion.div
            key={slot}
            initial={false}
            animate={reduced ? {} : { rotate, y: [0, slot % 2 ? -6 : 6, 0] }}
            transition={{
              rotate: { duration: 0.4 },
              y: { duration: 6 + slot, repeat: Infinity, ease: "easeInOut" },
            }}
            style={{ rotate }}
            className="relative h-44 w-32 shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] lg:h-56 lg:w-40"
          >
            <AnimatePresence mode="popLayout">
              <motion.div
                key={ep.id}
                initial={reduced ? false : { opacity: 0, scale: 1.12, filter: "blur(12px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={reduced ? {} : { opacity: 0, scale: 0.92, filter: "blur(12px)" }}
                transition={MORPH}
                className="absolute inset-0"
              >
                <Poster ep={ep} />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
