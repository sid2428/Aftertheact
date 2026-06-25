"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import ScrollDigit from "./ScrollDigit";
import LiveScoreboard from "./LiveScoreboard";

const SCORE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

// Animated rating bar with fill animation triggered on mount
function RatingBar({ label, value, color }) {
  const pct = Math.max(0, Math.min(100, (value / 10) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between font-display font-black uppercase tracking-widest text-[10px] text-white/50">
        <span>{label}</span>
        <span className="font-mono text-white/80">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

function ScoreWheel({ label, value, onChange }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="font-display text-[10px] uppercase tracking-widest text-white/50">{label}</span>
      <ScrollDigit options={SCORE_OPTIONS} value={value} onChange={onChange} size="lg" />
    </div>
  );
}

function JudgeCard({ judge, badge, mine, isLoggedIn }) {
  const [agg, setAgg] = useState(judge.agg);
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(mine?.score ?? 5);
  const [comment, setComment] = useState(mine?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [hovered, setHovered] = useState(false);

  // 3D tilt effect
  const cardRef = useRef(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    rotateX.set(-dy * 8);
    rotateY.set(dx * 8);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    setHovered(false);
  };

  // Determine glow color based on badge or default
  const glowColor =
    badge === "controversial"
      ? "rgba(139,30,45,0.7)"
      : badge === "favourite"
      ? "rgba(212,175,55,0.7)"
      : "rgba(212,175,55,0.3)";

  const borderColor =
    badge === "controversial"
      ? "#8B1E2D"
      : badge === "favourite"
      ? "#D4AF37"
      : "rgba(255,255,255,0.1)";

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/judges/${encodeURIComponent(judge.id)}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, comment }),
      });
      const json = await res.json();
      if (json.success) {
        setAgg(json.data);
        setSaved(true);
      } else {
        setError(json.error || "Failed to submit.");
      }
    } catch {
      setError("Network error — try again.");
    }
    setBusy(false);
  };

  return (
    <motion.div
      ref={cardRef}
      style={{ rotateX: springX, rotateY: springY, transformPerspective: 1000 }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative flex flex-col rounded-xl overflow-hidden"
      style={{
        rotateX: springX,
        rotateY: springY,
        transformPerspective: 1000,
        boxShadow: hovered
          ? `0 0 0 1px ${borderColor}, 0 0 40px ${glowColor}, 0 25px 50px rgba(0,0,0,0.6)`
          : `0 0 0 1px rgba(255,255,255,0.07), 0 10px 30px rgba(0,0,0,0.4)`,
        transition: "box-shadow 0.4s ease",
        background: "linear-gradient(145deg, #161616 0%, #0e0e0e 100%)",
      }}
    >
      {/* Animated top glow line */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[1px] z-20"
        animate={{
          background: hovered
            ? `linear-gradient(90deg, transparent 0%, ${borderColor} 50%, transparent 100%)`
            : "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
        }}
        transition={{ duration: 0.4 }}
      />

      {/* Floating badge */}
      {badge && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
          className="absolute top-4 right-4 z-30"
        >
          <span className={`flex items-center gap-1.5 text-[10px] font-display font-black uppercase tracking-widest px-3 py-1.5 rounded-full border backdrop-blur-sm ${
            badge === "controversial"
              ? "bg-latent-crimson/20 text-latent-crimson border-latent-crimson/50 shadow-[0_0_15px_rgba(139,30,45,0.4)]"
              : "bg-latent-gold/20 text-latent-gold border-latent-gold/50 shadow-[0_0_15px_rgba(212,175,55,0.4)]"
          }`}>
            <span>{badge === "controversial" ? "🔥" : "⭐"}</span>
            {badge === "controversial" ? "Most Controversial" : "Fan Favourite"}
          </span>
        </motion.div>
      )}

      {/* Judge photo */}
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        {judge.image ? (
          <>
            <motion.img
              src={judge.image}
              alt={judge.name}
              className="absolute inset-0 h-full w-full object-cover object-top"
              animate={{ scale: hovered ? 1.06 : 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/20 to-transparent" />
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-500"
              style={{
                opacity: hovered ? 0.15 : 0,
                background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`,
              }}
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display font-black text-8xl text-white/5">
            {judge.name?.[0] || "?"}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-display font-black uppercase tracking-tight text-2xl text-white leading-tight">
          {judge.name}
        </h3>
        {judge.descriptor && (
          <div className="font-display font-bold uppercase tracking-widest text-xs text-latent-gold mt-1 mb-1">
            {judge.descriptor}
          </div>
        )}
        {judge.instagram_handle && (
          <a
            href={`https://instagram.com/${judge.instagram_handle.replace(/^@/, "")}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-white/30 hover:text-latent-gold transition-colors"
          >
            {judge.instagram_handle}
          </a>
        )}
        {judge.bio && (
          <p className="text-sm text-white/50 mt-3 leading-relaxed line-clamp-3">{judge.bio}</p>
        )}

        {/* Rating bar */}
        <div className="mt-5 space-y-2">
          <RatingBar label="Community Rating" value={agg.avgScore} color="linear-gradient(to right, #D4AF37, #8B1E2D)" />
        </div>

        {/* Juror count */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex -space-x-1">
            {[...Array(Math.min(agg.count, 4))].map((_, i) => (
              <div key={i} className="w-5 h-5 rounded-full bg-white/10 border border-white/5 flex items-center justify-center text-[8px] text-white/30 font-bold">
                {i + 1}
              </div>
            ))}
          </div>
          <span className="font-mono text-[11px] text-white/30">
            {agg.count} {agg.count === 1 ? "juror" : "jurors"} rated
          </span>
        </div>

        {/* Rating form */}
        <div className="mt-5 pt-4 border-t border-white/5">
          {!isLoggedIn ? (
            <Link
              href="/api/auth/signin"
              className="flex items-center justify-center gap-2 w-full text-center bg-white/5 hover:bg-latent-gold/10 border border-white/10 hover:border-latent-gold/30 text-white/50 hover:text-latent-gold font-display font-black uppercase tracking-widest text-xs py-3 rounded-lg transition-all duration-300"
            >
              <span>⚖</span> Sign in to rate
            </Link>
          ) : (
            <>
              <motion.button
                onClick={() => setOpen((o) => !o)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full text-center font-display font-black uppercase tracking-widest text-xs py-3 rounded-lg transition-all duration-300 ${
                  open
                    ? "bg-white/10 text-white/60 border border-white/10"
                    : "bg-gradient-to-r from-latent-crimson/20 to-latent-gold/10 hover:from-latent-crimson/30 hover:to-latent-gold/20 text-white border border-latent-crimson/30 hover:border-latent-crimson/50 shadow-[0_0_15px_rgba(139,30,45,0.2)] hover:shadow-[0_0_25px_rgba(139,30,45,0.4)]"
                }`}
              >
                {open ? "✕ Close" : "⚖ Rate This Judge"}
              </motion.button>

              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 pt-4">
                      {mine && !saved && (
                        <div className="text-[11px] font-mono text-latent-gold bg-latent-gold/5 border border-latent-gold/20 rounded-md px-3 py-2">
                          You&apos;ve already rated. Submit to update.
                        </div>
                      )}
                      <div className="flex items-center justify-center rounded-xl border border-white/10 bg-[#0A0A0A] py-5 shadow-inner">
                        <ScoreWheel label="Your Score" value={score} onChange={setScore} />
                      </div>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={200}
                        rows={2}
                        placeholder="Optional verdict comment…"
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-3 font-mono text-sm text-white placeholder:text-white/20 focus:border-latent-gold/40 focus:shadow-[0_0_15px_rgba(212,175,55,0.1)] outline-none resize-none transition-all"
                      />
                      {error && (
                        <div className="text-latent-crimson font-mono text-xs bg-latent-crimson/5 border border-latent-crimson/20 rounded px-3 py-2">
                          {error}
                        </div>
                      )}
                      {saved && (
                        <div className="text-latent-gold font-mono text-xs bg-latent-gold/5 border border-latent-gold/20 rounded px-3 py-2">
                          ✓ Rating saved — the jury has spoken.
                        </div>
                      )}
                      <motion.button
                        onClick={submit}
                        disabled={busy}
                        whileHover={!busy ? { scale: 1.02, boxShadow: "0 0 25px rgba(139,30,45,0.7)" } : {}}
                        whileTap={!busy ? { scale: 0.98 } : {}}
                        className="w-full bg-latent-crimson text-white font-display font-black uppercase tracking-widest py-3 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(139,30,45,0.3)]"
                      >
                        {busy ? "Submitting…" : "Lock In Verdict"}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function JudgePageClient({ judges, myRatings, mostControversialId, fanFavouriteId, dbReady, isLoggedIn }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[45vh] flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,_var(--tw-gradient-stops))] from-latent-gold/8 via-transparent to-transparent pointer-events-none" />
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-latent-gold/30"
              style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 25}%` }}
              animate={{ y: [-10, 10, -10], opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
            />
          ))}
        </div>

        <svg className="hidden lg:block absolute left-10 xl:left-24 top-1/2 -translate-y-1/2 opacity-10" width="220" height="220" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v18" /><path d="M7 21h10" /><path d="M5 7h14" /><path d="M12 3a2 2 0 1 0 0-.001" />
          <path d="M5 7l-3 6a3 3 0 0 0 6 0L5 7Z" /><path d="M19 7l-3 6a3 3 0 0 0 6 0l-3-6Z" />
        </svg>

        <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-12 relative z-10 lg:text-right">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl sm:text-8xl font-display font-black tracking-tighter uppercase text-white leading-[0.85]"
          >
            JUDGE THE<br />JUDGES
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl text-white/50 font-medium mt-4"
          >
            The jury is now on trial.
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 sm:px-12 pb-32">
        {!dbReady && (
          <div className="bg-[#111111] border border-latent-gold/30 rounded-md p-6 text-white/70 font-mono text-sm mb-8">
            Ratings aren&apos;t set up yet — run the JudgeRating migration to enable scoring.
          </div>
        )}

        {judges.length === 0 ? (
          <div className="text-center py-16 text-white/30 font-display font-black uppercase tracking-widest">
            No judges on the panel yet.
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {judges.map((j, i) => (
                <JudgeCard
                  key={j.id}
                  judge={j}
                  badge={j.id === mostControversialId ? "controversial" : j.id === fanFavouriteId ? "favourite" : null}
                  mine={myRatings[j.id] || null}
                  isLoggedIn={isLoggedIn}
                />
              ))}
            </div>

            <JudgesScoreboard judges={judges} />
          </>
        )}
      </div>
    </div>
  );
}

function JudgesScoreboard({ judges }) {
  const rated = judges.filter((j) => j.agg.count > 0);
  if (rated.length === 0) return null;

  const rows = rated
    .map((j) => ({
      id: j.id,
      name: j.name,
      talentType: j.descriptor || "Judge",
      imageUrl: j.image,
      score: j.agg.avgScore,
      votes: j.agg.count,
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <section className="mt-24 space-y-6">
      <div className="flex items-end justify-between border-b border-brand-border pb-3">
        <h2 className="text-3xl font-display font-black uppercase tracking-widest text-white">Judges Scoreboard</h2>
        <span className="font-display text-xs uppercase tracking-widest text-white/50">By Panel Score</span>
      </div>
      <div className="scoreboard-table-wrapper rounded-md p-3 sm:p-4">
        <LiveScoreboard rows={rows} revealOnMount ariaLabel="Judges scoreboard" />
      </div>
    </section>
  );
}
