"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import EpisodePoster from "./EpisodePoster";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { Play, Trophy, Clock, Radio, Users, ArrowDownUp } from "lucide-react";

const TILT_SPRING = { stiffness: 200, damping: 18, mass: 0.4 };

// Which episodes each filter chip surfaces.
const FILTERS = [
  { id: "ALL", label: "All", match: () => true },
  { id: "LIVE", label: "Live", match: (s) => s === "LIVE" },
  { id: "UPCOMING", label: "Upcoming", match: (s) => s === "UPCOMING" },
  { id: "RESULTS", label: "Results", match: (s) => s === "REVEALED" },
];

import EpisodeCard, { statusPill } from "./EpisodeCard";

export default function EpisodeDirectory({ episodes = [] }) {
  const reduced = useReducedMotion();
  const [filter, setFilter] = useState("ALL");
  const [descending, setDescending] = useState(true); // latest first by default

  // Per-filter counts for the chip badges.
  const counts = useMemo(() => {
    const c = { ALL: episodes.length, LIVE: 0, UPCOMING: 0, RESULTS: 0 };
    for (const ep of episodes) {
      if (ep.status === "LIVE") c.LIVE++;
      else if (ep.status === "UPCOMING") c.UPCOMING++;
      else if (ep.status === "REVEALED") c.RESULTS++;
    }
    return c;
  }, [episodes]);

  const visible = useMemo(() => {
    const match = FILTERS.find((f) => f.id === filter)?.match ?? (() => true);
    return [...episodes]
      .filter((ep) => match(ep.status))
      .sort((a, b) => {
        const diff = (a.episode_number || 0) - (b.episode_number || 0);
        return descending ? -diff : diff;
      });
  }, [episodes, filter, descending]);

  return (
    <div className="space-y-8">
      {/* Control bar: glassy segmented status filter + sort toggle. */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5 border-4 border-white/10 bg-brand-panel p-1.5 shadow-[var(--shadow-brutal-sm)]">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-2 border-2 px-4 py-2 font-display text-xs uppercase tracking-widest transition-all duration-300 ${
                  active
                    ? f.id === "LIVE"
                      ? "border-broadcast-red bg-broadcast-red text-white shadow-[var(--shadow-brutal-sm)]"
                      : "border-latent-gold bg-[#120f02] text-latent-gold shadow-[var(--shadow-brutal-sm)]"
                    : "border-transparent text-white/50 hover:border-white/20 hover:text-white"
                }`}
              >
                {f.id === "LIVE" && <Radio className="h-3.5 w-3.5" strokeWidth={2.5} />}
                {f.label}
                <span className={`tabular-nums ${active ? "opacity-70" : "text-white/30"}`}>{counts[f.id]}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setDescending((d) => !d)}
          className="flex shrink-0 items-center gap-2 self-start border-4 border-white/10 bg-brand-panel px-4 py-2.5 font-display text-xs uppercase tracking-widest text-white/60 shadow-[var(--shadow-brutal-sm)] transition-all duration-300 hover:border-latent-gold/30 hover:text-latent-gold sm:self-auto"
        >
          <ArrowDownUp className="h-3.5 w-3.5" strokeWidth={2.5} />
          {descending ? "Newest first" : "Oldest first"}
        </button>
      </div>

      {visible.length > 0 ? (
        <motion.div layout className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {visible.map((ep, i) => (
              <EpisodeCard key={ep.id} ep={ep} index={i} reduced={reduced} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="glass-surface rounded-[2rem] border border-dashed border-white/10 py-16 text-center font-display uppercase tracking-widest text-white/30">
          {filter === "ALL"
            ? "No episodes logged. The acts are still preparing their sob stories. 🎻😭"
            : `No ${filter.toLowerCase()} episodes right now.`}
        </div>
      )}
    </div>
  );
}
