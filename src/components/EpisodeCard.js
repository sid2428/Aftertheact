"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Play, Trophy, Clock } from "lucide-react";
import EpisodePoster from "./EpisodePoster";

const TILT_SPRING = { stiffness: 200, damping: 18, mass: 0.4 };

export function statusPill(status) {
  return status === "LIVE"
    ? "bg-latent-crimson/20 text-latent-crimson border-latent-crimson/50"
    : status === "UPCOMING"
    ? "bg-white/5 text-white/50 border-white/15"
    : "bg-latent-gold/15 text-latent-gold border-latent-gold/40";
}

const ACTION_BASE =
  "flex items-center justify-center gap-1.5 rounded-xl border py-2.5 font-display text-xs uppercase tracking-widest transition-all duration-300";

function EpisodeActions({ ep }) {
  const href = `/episode/${ep.id}`;
  const isLive = ep.status === "LIVE";
  const isRevealed = ep.status === "REVEALED";
  const showVote = true;
  const showResult = true;
  const singleButton = false;

  return (
    <div className={`mt-4 grid gap-3 ${singleButton ? "grid-cols-1" : "grid-cols-2"}`}>
      {showVote && (
        isLive ? (
          <Link
            href={href}
            className={`${ACTION_BASE} border-broadcast-red bg-broadcast-red/15 text-broadcast-red hover:bg-broadcast-red hover:text-white hover:shadow-[var(--shadow-brutal-sm)]`}
          >
            <Play className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
            Vote
          </Link>
        ) : (
          <span
            aria-disabled="true"
            title="Voting opens at air time"
            className={`${ACTION_BASE} cursor-not-allowed border-white/10 text-white/25`}
          >
            <Play className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
            Vote
          </span>
        )
      )}

      {showResult && (
        isRevealed ? (
          <Link
            href={href}
            className={`${ACTION_BASE} border-latent-gold/50 bg-[#120f02] text-latent-gold hover:border-latent-gold hover:shadow-[var(--shadow-brutal-sm)]`}
          >
            <Trophy className="h-3.5 w-3.5" strokeWidth={2.5} />
            Result
          </Link>
        ) : (
          <span
            aria-disabled="true"
            title="Results aren't out yet"
            className={`${ACTION_BASE} cursor-not-allowed border-white/10 text-white/25`}
          >
            <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
            Soon
          </span>
        )
      )}
    </div>
  );
}

export default function EpisodeCard({ ep, index = 0, reduced = false, flat = false, className = "", innerClassName = "" }) {
  const isLive = ep.status === "LIVE";

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [6, -6]), TILT_SPRING);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-6, 6]), TILT_SPRING);

  function handleMove(e) {
    if (reduced || flat) return;
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleLeave() {
    px.set(0);
    py.set(0);
  }

  return (
    <motion.div
      layout={!reduced && !flat}
      initial={reduced ? undefined : { opacity: 0, y: 24 }}
      animate={reduced ? undefined : { opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -12, scale: 0.97 }}
      transition={reduced ? { duration: 0.15 } : { duration: 0.5, delay: Math.min(index * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
      style={flat ? undefined : { perspective: 1000 }}
      className={className}
    >
      <motion.div
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={flat ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={`group/card flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 ${flat ? "card-surface" : "glass-surface"} shadow-2xl transition-all duration-500 ${
          isLive
            ? "border-latent-crimson/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_0_40px_rgba(139,30,45,0.3)]"
            : "border-latent-gold/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_0_24px_rgba(212,175,55,0.18)] hover:border-latent-gold/50 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_40px_rgba(212,175,55,0.3)]"
        } ${innerClassName}`}
      >
        {/* Poster */}
        <div className="relative h-64 w-full overflow-hidden shrink-0" style={{ transform: "translateZ(20px)" }}>
          <EpisodePoster imageUrl={ep.thumbnail_url} label={`S${ep.season_number}E${ep.episode_number}`} className="absolute inset-0 z-0" />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/30 to-transparent pointer-events-none" />

          <span className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-display text-[10px] uppercase tracking-widest ${statusPill(ep.status)}`}>
            {isLive && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-latent-crimson opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-latent-crimson" />
              </span>
            )}
            {ep.status}
          </span>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col justify-between p-5" style={{ transform: "translateZ(30px)" }}>
          <div>
            <div className="flex items-center gap-2 font-display text-xs uppercase tracking-widest text-white/40">
              <span>S{ep.season_number}E{ep.episode_number}</span>
            </div>
            <h3 className="mt-1.5 font-display text-xl uppercase leading-tight text-white transition-colors group-hover/card:text-latent-gold">
              {ep.title}
            </h3>
          </div>
          <EpisodeActions ep={ep} />
        </div>
      </motion.div>
    </motion.div>
  );
}
