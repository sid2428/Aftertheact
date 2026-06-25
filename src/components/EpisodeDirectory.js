"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  { id: "RESULTS", label: "Results", match: (s) => s === "REVEALED" || s === "ARCHIVED" },
];

function statusPill(status) {
  return status === "LIVE"
    ? "bg-latent-crimson/20 text-latent-crimson border-latent-crimson/50"
    : status === "UPCOMING"
    ? "bg-white/5 text-white/50 border-white/15"
    : "bg-latent-gold/15 text-latent-gold border-latent-gold/40";
}

const ACTION_BASE =
  "flex items-center justify-center gap-1.5 rounded-full border py-2.5 font-display text-xs uppercase tracking-widest transition-all duration-300";

// Status-gated actions. Vote links out only while LIVE; Result only once the
// verdict is out. Unavailable actions render as clearly disabled chips.
function EpisodeActions({ ep }) {
  const href = `/episode/${ep.id}`;
  const isLive = ep.status === "LIVE";
  const isRevealed = ep.status === "REVEALED" || ep.status === "ARCHIVED";

  // Past episodes: only Result. Live episodes: only Vote. Upcoming: both (disabled).
  const showVote = !isRevealed;
  const showResult = !isLive;
  const singleButton = showVote !== showResult; // XOR → exactly one shown

  return (
    <div className={`mt-4 grid gap-3 ${singleButton ? "grid-cols-1" : "grid-cols-2"}`}>
      {showVote && (
        isLive ? (
          <Link
            href={href}
            className={`${ACTION_BASE} border-latent-crimson/60 bg-latent-crimson/15 text-latent-crimson backdrop-blur-md hover:bg-latent-crimson hover:text-white hover:shadow-[0_0_22px_rgba(139,30,45,0.6)]`}
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
            className={`${ACTION_BASE} border-latent-gold/50 bg-latent-gold/10 text-latent-gold backdrop-blur-md hover:bg-latent-gold hover:text-[#0A0A0A] hover:shadow-[0_0_22px_rgba(212,175,55,0.5)]`}
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

// One glassy, pointer-tilting episode card. LIVE episodes carry a crimson glow
// and a pulsing indicator so they read as urgent.
function EpisodeCard({ ep, index, reduced }) {
  const airDate = ep.air_date ? new Date(ep.air_date).toLocaleDateString("en-GB") : "TBA";
  const count = ep.ContestantEpisodeAppearance?.[0]?.count ?? null;
  const isLive = ep.status === "LIVE";

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [6, -6]), TILT_SPRING);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-6, 6]), TILT_SPRING);

  function handleMove(e) {
    if (reduced) return;
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
      layout={!reduced}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={reduced ? { duration: 0.15 } : { duration: 0.5, delay: Math.min(index * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={`group/card flex h-full flex-col overflow-hidden rounded-3xl border backdrop-blur-md transition-all duration-300 ${
          isLive
            ? "border-latent-crimson/45 bg-latent-crimson/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_30px_rgba(139,30,45,0.22)]"
            : "border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_20px_50px_rgba(0,0,0,0.4)] hover:border-latent-gold/30 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_30px_rgba(212,175,55,0.18)]"
        }`}
      >
        {/* Poster */}
        <div className="relative h-44 w-full overflow-hidden" style={{ transform: "translateZ(20px)" }}>
          {ep.thumbnail_url ? (
            <Image
              src={ep.thumbnail_url}
              alt={ep.title}
              fill
              sizes="(max-width:1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-110"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#161616] to-[#0A0A0A]">
              <span className="font-display text-[5rem] leading-none text-white/[0.06]">E{ep.episode_number}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/20 to-transparent" />

          <span className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-display text-[10px] uppercase tracking-widest backdrop-blur-md ${statusPill(ep.status)}`}>
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
              <span>S{ep.season_number} · E{ep.episode_number}</span>
              {count != null && (
                <span className="inline-flex items-center gap-1 text-white/35">
                  <span className="text-white/20">·</span>
                  <Users className="h-3 w-3" strokeWidth={2.5} />
                  {count} {count === 1 ? "act" : "acts"}
                </span>
              )}
            </div>
            <h3 className="mt-1.5 font-display text-xl uppercase leading-tight text-white transition-colors group-hover/card:text-latent-gold">
              {ep.title}
            </h3>
            <div className="mt-1 font-number text-xs font-semibold text-white/40">Air: {airDate}</div>
          </div>
          <EpisodeActions ep={ep} />
        </div>
      </motion.div>
    </motion.div>
  );
}

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
      else if (ep.status === "REVEALED" || ep.status === "ARCHIVED") c.RESULTS++;
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
        <div className="flex flex-wrap gap-1.5 rounded-full border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-md">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 font-display text-xs uppercase tracking-widest transition-all duration-300 ${
                  active
                    ? f.id === "LIVE"
                      ? "bg-latent-crimson text-white shadow-[0_0_18px_rgba(139,30,45,0.5)]"
                      : "bg-latent-gold text-[#0A0A0A] shadow-[0_0_18px_rgba(212,175,55,0.4)]"
                    : "text-white/50 hover:text-white"
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
          className="flex shrink-0 items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 font-display text-xs uppercase tracking-widest text-white/60 backdrop-blur-md transition-all duration-300 hover:border-latent-gold/30 hover:text-latent-gold sm:self-auto"
        >
          <ArrowDownUp className="h-3.5 w-3.5" strokeWidth={2.5} />
          {descending ? "Newest first" : "Oldest first"}
        </button>
      </div>

      {visible.length > 0 ? (
        <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((ep, i) => (
              <EpisodeCard key={ep.id} ep={ep} index={i} reduced={reduced} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center font-display uppercase tracking-widest text-white/30 backdrop-blur-md">
          {filter === "ALL"
            ? "No episodes logged. The acts are still preparing their sob stories. 🎻😭"
            : `No ${filter.toLowerCase()} episodes right now.`}
        </div>
      )}
    </div>
  );
}
