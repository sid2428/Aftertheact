"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { Crown, TrendingUp, TrendingDown, Flame } from "lucide-react";
import RollingNumber from "./RollingNumber";

const ROW_SPRING = { type: "spring", stiffness: 240, damping: 26, mass: 0.95 };
const TILT_SPRING = { stiffness: 220, damping: 18, mass: 0.4 };

export default function ScoreboardRow({
  row,
  rank,
  score,
  scorePct = 0,
  flash,
  leaderBeat = false,
  compact,
  reduced,
}) {
  const initial = row.name?.[0]?.toUpperCase() || "?";
  const isLeader = rank === 1;
  const isPodium = rank <= 3;

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
  const beatClass = leaderBeat ? "shadow-[0_0_42px_rgba(245,217,123,0.55)]" : "";

  const barFrom = isLeader ? "rgba(212,175,55,0.28)" : "rgba(139,30,45,0.30)";
  const barLine = isLeader ? "#D4AF37" : "rgba(139,30,45,0.85)";

  return (
    <motion.div
      layout={!reduced}
      role="listitem"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={reduced ? { duration: 0.15 } : ROW_SPRING}
      style={{ perspective: 900 }}
      className={`relative ${flashClass} ${beatClass}`}
    >
      <motion.div
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        animate={leaderBeat && !reduced ? { scale: [1, 1.018, 1] } : { scale: 1 }}
        transition={leaderBeat && !reduced ? { duration: 1.15, ease: [0.16, 1, 0.3, 1] } : undefined}
        className={`group relative overflow-hidden rounded-2xl border backdrop-blur-md transition-all duration-300 ${
          isLeader
            ? "border-latent-gold/45 bg-latent-gold/[0.09] shadow-[0_0_28px_rgba(212,175,55,0.22),inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-latent-gold/[0.12]"
            : "glass-row border-white/10 hover:border-white/20"
        }`}
      >
        {/* Score bar background */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-0"
          style={{ background: `linear-gradient(90deg, ${barFrom}, transparent)` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(6, Math.min(100, scorePct * 100))}%` }}
          transition={reduced ? { duration: 0 } : { delay: 0.25, duration: 1, ease: "easeOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 z-0 h-[2px]"
          style={{ background: barLine, boxShadow: `0 0 8px ${barLine}` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(4, Math.min(100, scorePct * 100))}%` }}
          transition={reduced ? { duration: 0 } : { delay: 0.25, duration: 1, ease: "easeOut" }}
        />

        {/* Leader shimmer */}
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
            transition={
              leaderBeat
                ? { duration: 1.1, ease: [0.16, 1, 0.3, 1] }
                : { duration: 2.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.6 }
            }
          />
        )}

        {/* Leader beat pulse */}
        {leaderBeat && !reduced && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 rounded-2xl"
            initial={{ opacity: 0.55, scale: 0.98 }}
            animate={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 1.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ boxShadow: "inset 0 0 34px rgba(245,217,123,0.35), 0 0 42px rgba(212,175,55,0.3)" }}
          />
        )}

        {/* ── Content layout ── */}
        <div className="relative z-10 flex items-center gap-3 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5">

          {/* Rank */}
          <div className="flex w-10 shrink-0 justify-center sm:w-14" style={{ transform: "translateZ(30px)" }}>
            {isPodium ? (
              <div className="relative flex flex-col items-center">
                {isLeader && (
                  <motion.span
                    className="absolute -top-5"
                    animate={leaderBeat && !reduced ? { y: [-10, 2, 0], rotate: [-8, 4, 0], scale: [0.85, 1.15, 1] } : { y: 0 }}
                    transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Crown className="h-4 w-4 text-latent-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.7)] sm:h-5 sm:w-5" strokeWidth={2.5} />
                  </motion.span>
                )}
                <div
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-black shadow-[0_4px_10px_rgba(0,0,0,0.5)] sm:h-11 sm:w-11 sm:text-xl ${
                    isLeader
                      ? "bg-latent-gold text-black shadow-[0_0_18px_rgba(212,175,55,0.65)]"
                      : rank === 2
                      ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                      : "bg-latent-crimson text-white shadow-[0_0_15px_rgba(139,30,45,0.5)]"
                  }`}
                >
                  {rank}
                </div>
                <div className="absolute -bottom-2.5 z-0 flex gap-0.5">
                  <div className={`h-4 w-2.5 -skew-y-[30deg] sm:w-3 ${isLeader ? "bg-latent-crimson" : rank === 2 ? "bg-white/40" : "bg-latent-crimson/50"}`} />
                  <div className={`h-4 w-2.5 skew-y-[30deg] sm:w-3 ${isLeader ? "bg-latent-crimson" : rank === 2 ? "bg-white/40" : "bg-latent-crimson/50"}`} />
                </div>
              </div>
            ) : (
              <span className="font-display text-xl font-black text-white/50 sm:text-2xl">{rank}</span>
            )}
          </div>

          {/* Avatar */}
          <div
            className={`relative z-10 h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 bg-[#0A0A0A] sm:h-12 sm:w-12 ${
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
                sizes="48px"
                className={`object-cover transition-all duration-500 ${isPodium ? "grayscale-0" : "grayscale group-hover:grayscale-0"}`}
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-display text-lg text-white/20">{initial}</span>
            )}
          </div>

          {/* Name + talent type */}
          <div className="z-10 min-w-0 flex-1" style={{ transform: "translateZ(20px)" }}>
            <div
              className={`flex items-center gap-1.5 font-display uppercase tracking-wider ${
                isLeader ? "text-base text-latent-gold sm:text-xl" : "text-sm sm:text-lg"
              } text-white`}
            >
              <span className="truncate">{row.name}</span>
              {row.controversy && (
                <Flame className="h-3.5 w-3.5 shrink-0 text-latent-crimson" strokeWidth={2.5} aria-label="Controversy" />
              )}
              {flash === "up" && <TrendingUp className="h-3.5 w-3.5 shrink-0 text-latent-gold" strokeWidth={3} />}
              {flash === "down" && <TrendingDown className="h-3.5 w-3.5 shrink-0 text-white/40" strokeWidth={3} />}
            </div>
            {!compact && (
              <div className="mt-0.5 truncate font-number text-[10px] font-semibold uppercase tracking-widest text-white/35 sm:text-xs">
                {row.talentType}
                {row.episodeLabel ? ` · ${row.episodeLabel}` : ""}
              </div>
            )}
          </div>

          {/* Score */}
          <div className="z-10 shrink-0 text-right" style={{ transform: "translateZ(30px)" }}>
            <RollingNumber
              value={Number(score)}
              decimals={1}
              height={compact ? 28 : 32}
              className={`justify-end font-bold transition-colors ${
                isLeader ? "text-latent-gold drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]" : "text-white/90"
              }`}
            />
            {!compact && row.votes != null && (
              <div className="mt-0.5 font-number text-[9px] font-semibold uppercase tracking-widest text-white/25">
                {Number(row.votes ?? 0)} votes
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
