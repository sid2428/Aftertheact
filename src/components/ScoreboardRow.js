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
        className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border px-4 py-3 backdrop-blur-md transition-all duration-300 sm:gap-6 sm:px-8 sm:py-4 ${
          isLeader
            ? "border-latent-gold/45 bg-latent-gold/[0.09] shadow-[0_0_28px_rgba(212,175,55,0.22),inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-latent-gold/[0.12]"
            : "glass-row border-white/10 hover:border-white/20"
        }`}
      >
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

        <div className="relative z-10 flex w-12 shrink-0 justify-center sm:w-16" style={{ transform: "translateZ(30px)" }}>
          {isPodium ? (
            <div className="relative flex flex-col items-center">
              {isLeader && (
                <motion.span
                  className="absolute -top-5"
                  animate={leaderBeat && !reduced ? { y: [-10, 2, 0], rotate: [-8, 4, 0], scale: [0.85, 1.15, 1] } : { y: 0 }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Crown className="h-5 w-5 text-latent-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.7)] sm:h-6 sm:w-6" strokeWidth={2.5} />
                </motion.span>
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
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display text-xl text-white/20">{initial}</span>
          )}
        </div>

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
              {row.episodeLabel ? ` - ${row.episodeLabel}` : ""}
              {row.controversy ? " - Controversy" : ""}
            </div>
          )}
        </div>

        <div className="z-10 min-w-[86px] shrink-0 text-right" style={{ transform: "translateZ(30px)" }}>
          <RollingNumber
            value={Number(score)}
            decimals={1}
            height={compact ? 32 : 40}
            className={`justify-end font-bold transition-colors ${
              isLeader ? "text-latent-gold drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]" : "text-white/90"
            }`}
          />
          {!compact && (
            <div className="mt-1 flex flex-col items-end gap-1">
              <div className="flex gap-2 font-number text-[10px] uppercase tracking-widest text-white/40">
                <span><span className="text-latent-crimson">J:</span> {row.judgeScore?.toFixed(1) || "-"}</span>
              </div>
              {row.votes != null && (
                <div className="text-[9px] font-semibold text-white/20">
                  {Number(row.votes ?? 0)} votes
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
