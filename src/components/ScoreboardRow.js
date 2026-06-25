"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import { Crown, TrendingUp, TrendingDown, Flame } from "lucide-react";

const SPRING = { type: "spring", stiffness: 380, damping: 40 };
const TILT_SPRING = { stiffness: 220, damping: 18, mass: 0.4 };

// Counting animation hook — counts from 0 to `target` once the element is in view.
function useCountUp(target, duration = 1400, decimals = 1) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const start = performance.now();
    const to = target;

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(parseFloat((to * eased).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [inView, target, duration, decimals]);

  return { display, ref };
}

export default function ScoreboardRow({
  row,
  rank,
  score,
  scorePct = 0,
  flash,
  compact,
  reduced,
}) {
  const initial = row.name?.[0]?.toUpperCase() || "?";
  const { display: animatedScore, ref: scoreRef } = useCountUp(Number(score), reduced ? 0 : 1400, 1);
  const { display: animatedVotes, ref: votesRef } = useCountUp(Number(row.votes ?? 0), reduced ? 0 : 1200, 0);

  const isLeader = rank === 1;
  const isPodium = rank <= 3;

  // ── Pointer-tracking 3D tilt. Motion values are only written in event
  // handlers (never during render) to stay clear of the strict refs lint.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [7, -7]), TILT_SPRING);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-7, 7]), TILT_SPRING);

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

  const flashClass =
    flash === "up"
      ? "shadow-[0_0_30px_rgba(212,175,55,0.5)]"
      : flash === "down"
      ? "opacity-60"
      : "";

  // Magnitude bar tint: gold for the leader, crimson for everyone else.
  const barFrom = isLeader ? "rgba(212,175,55,0.28)" : "rgba(139,30,45,0.30)";
  const barLine = isLeader ? "#D4AF37" : "rgba(139,30,45,0.85)";

  return (
    // Outer element owns the FLIP layout + enter/exit + perspective; the inner
    // element owns the tilt transform so the two never fight over `transform`.
    <motion.div
      layout={!reduced}
      role="listitem"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={reduced ? { duration: 0.15 } : SPRING}
      style={{ perspective: 900 }}
      className={`relative ${flashClass}`}
    >
      <motion.div
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={`group relative flex items-center gap-4 overflow-hidden rounded-full border px-4 py-3 backdrop-blur-md transition-all duration-300 sm:gap-6 sm:px-8 sm:py-4 ${
          isLeader
            ? "border-latent-gold/40 bg-latent-gold/[0.08] shadow-[0_0_28px_rgba(212,175,55,0.2),inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-latent-gold/[0.12]"
            : "glass-row border-white/10 hover:border-white/20"
        }`}
      >
        {/* Relative-score magnitude bar — anchored left, behind content. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-0"
          style={{ background: `linear-gradient(90deg, ${barFrom}, transparent)` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(6, Math.min(100, scorePct * 100))}%` }}
          transition={reduced ? { duration: 0 } : { delay: 0.25, duration: 1, ease: "easeOut" }}
        />
        {/* Crisp magnitude line along the bottom edge. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 z-0 h-[2px]"
          style={{ background: barLine, boxShadow: `0 0 8px ${barLine}` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(4, Math.min(100, scorePct * 100))}%` }}
          transition={reduced ? { duration: 0 } : { delay: 0.25, duration: 1, ease: "easeOut" }}
        />

        {/* Leader-only gold shimmer sweep. */}
        {isLeader && !reduced && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background:
                "linear-gradient(105deg, transparent 35%, rgba(245,217,123,0.22) 50%, transparent 65%)",
            }}
            initial={{ x: "-120%" }}
            animate={{ x: "120%" }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.6 }}
          />
        )}

        {/* 1. Rank / Medal */}
        <div className="relative z-10 flex w-12 shrink-0 justify-center sm:w-16" style={{ transform: "translateZ(30px)" }}>
          {isPodium ? (
            <div className="relative flex flex-col items-center">
              {isLeader && (
                <Crown className="absolute -top-5 h-5 w-5 text-latent-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.7)] sm:h-6 sm:w-6" strokeWidth={2.5} />
              )}
              <div
                className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full font-display text-lg font-black shadow-[0_4px_10px_rgba(0,0,0,0.5)] sm:h-12 sm:w-12 sm:text-2xl ${
                  isLeader
                    ? "bg-latent-gold text-black shadow-[0_0_18px_rgba(212,175,55,0.65)]"
                    : rank === 2
                    ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                    : "bg-latent-crimson text-white shadow-[0_0_15px_rgba(139,30,45,0.5)]"
                }`}
              >
                {rank}
              </div>
              <div className="absolute -bottom-3 z-0 flex gap-1">
                <div className={`h-5 w-3 -skew-y-[30deg] sm:w-3.5 ${isLeader ? "bg-latent-crimson" : rank === 2 ? "bg-white/40" : "bg-latent-crimson/50"}`} />
                <div className={`h-5 w-3 skew-y-[30deg] sm:w-3.5 ${isLeader ? "bg-latent-crimson" : rank === 2 ? "bg-white/40" : "bg-latent-crimson/50"}`} />
              </div>
            </div>
          ) : (
            <span className="font-display text-2xl font-black text-white/50 sm:text-3xl">{rank}</span>
          )}
        </div>

        {/* 2. Avatar */}
        <div
          className={`relative z-10 h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 bg-[#0A0A0A] sm:h-14 sm:w-14 ${
            isLeader
              ? "border-latent-gold shadow-[0_0_16px_rgba(212,175,55,0.45)]"
              : rank === 2
              ? "border-white/40"
              : rank === 3
              ? "border-latent-crimson/50"
              : "border-white/10"
          }`}
          style={{ transform: "translateZ(40px)" }}
        >
          {row.imageUrl ? (
            <Image
              src={row.imageUrl}
              alt={row.name}
              fill
              sizes="56px"
              className={`object-cover transition-all duration-500 ${isPodium ? "grayscale-0" : "grayscale group-hover:grayscale-0"}`}
              unoptimized
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display text-xl text-white/20">{initial}</span>
          )}
        </div>

        {/* 3. Name */}
        <div className="z-10 flex min-w-0 flex-1 flex-col items-start justify-center px-2 sm:items-center sm:px-4" style={{ transform: "translateZ(20px)" }}>
          <div
            className={`flex items-center gap-2 truncate font-display uppercase tracking-wider text-white ${
              isLeader ? "text-lg text-latent-gold sm:text-2xl" : "text-base sm:text-xl"
            }`}
          >
            <span className="truncate">{row.name}</span>
            {row.controversy && (
              <Flame className="h-4 w-4 shrink-0 text-latent-crimson" strokeWidth={2.5} aria-label="Controversy" />
            )}
            {flash === "up" && <TrendingUp className="h-4 w-4 shrink-0 text-latent-gold" strokeWidth={3} />}
            {flash === "down" && <TrendingDown className="h-4 w-4 shrink-0 text-white/40" strokeWidth={3} />}
          </div>
          {!compact && (
            <div className="mt-1 truncate font-number text-xs font-semibold uppercase tracking-widest text-white/40">
              {row.talentType}
              {row.episodeLabel ? ` · ${row.episodeLabel}` : ""}
              {row.controversy ? " · Controversy" : ""}
            </div>
          )}
        </div>

        {/* 4. Score — counting animation */}
        <div ref={scoreRef} className="z-10 min-w-[80px] shrink-0 text-right" style={{ transform: "translateZ(30px)" }}>
          <div
            className={`font-bold leading-none tabular-nums transition-colors text-2xl sm:text-4xl ${
              isLeader ? "text-latent-gold drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]" : "text-white/90"
            }`}
          >
            {animatedScore.toFixed(1)}
          </div>
          {!compact && row.votes != null && (
            <div ref={votesRef} className="mt-1.5 font-number text-[10px] font-semibold uppercase tracking-widest text-white/30 sm:text-[11px]">
              {animatedVotes} votes
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
