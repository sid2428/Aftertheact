"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { DrumColumn, DRUM_H } from "./VotingScoreWheel";
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
      <div className="flex items-baseline gap-1 font-number leading-none">
        <span className="text-3xl font-black text-latent-gold">{value}</span>
        <span className="text-sm font-bold text-white/30">/ 10</span>
      </div>
      <div
        style={{ 
          position: "relative",
          height: DRUM_H,
          width: 110,
          overflow: "hidden",
          borderRadius: 12,
          background: "rgba(0,0,0,0.4)",
          boxShadow: "inset 0 0 20px rgba(0,0,0,0.9)"
        }}
      >
        <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "linear-gradient(to bottom, #111 0%, transparent 25%, transparent 75%, #111 100%)", pointerEvents: "none" }} />
        <DrumColumn options={SCORE_OPTIONS} lockedValue={value} onLocked={onChange} id="judge-score" />
      </div>
    </div>
  );
}

function JudgeCard({ judge, badge, mine, isLoggedIn, episodeId }) {
  const [agg, setAgg] = useState(judge.agg);
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(mine?.score ?? 5);
  const [comment, setComment] = useState(mine?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [hovered, setHovered] = useState(false);

  const cardRef = useRef(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  const handleMouseMove = (e) => {
    if (!cardRef.current || open) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    rotateX.set(-dy * 4);
    rotateY.set(dx * 4);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    setHovered(false);
  };

  const toggleOpen = () => {
    rotateX.set(0);
    rotateY.set(0);
    setOpen((o) => !o);
  };

  const glowColor =
    badge === "controversial" ? "rgba(139,30,45,0.4)" :
    badge === "favourite"     ? "rgba(212,175,55,0.4)" :
                                "rgba(212,175,55,0.1)";

  const borderColor =
    badge === "controversial" ? "#8B1E2D" :
    badge === "favourite"     ? "#D4AF37"  :
                                "rgba(255,255,255,0.1)";

  const submit = async () => {
    if (busy || !episodeId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/judges/${encodeURIComponent(judge.id)}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, comment, episodeId }),
      });
      const json = await res.json();
      if (json.success) { setAgg(json.data); setSaved(true); }
      else setError(json.error || "Failed to submit.");
    } catch {
      setError("Network error — try again.");
    }
    setBusy(false);
  };

  const igHandle = judge.instagram_handle;
  const igUrl = igHandle ? `https://instagram.com/${igHandle.replace(/^@/, "")}` : null;

  return (
    <motion.div
      layout
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ layout: { duration: 0.45, ease: [0.16, 1, 0.3, 1] }, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-xl overflow-hidden${open ? " sm:col-span-2 lg:col-span-3" : ""}`}
      style={{
        rotateX: open ? 0 : springX,
        rotateY: open ? 0 : springY,
        transformPerspective: 1000,
        boxShadow: hovered && !open
          ? `0 0 0 1px ${borderColor}, 0 0 20px ${glowColor}, 0 20px 40px rgba(0,0,0,0.5)`
          : `0 0 0 1px rgba(255,255,255,0.07), 0 10px 30px rgba(0,0,0,0.4)`,
        transition: "box-shadow 0.4s ease",
        background: "linear-gradient(145deg, #161616 0%, #0e0e0e 100%)",
      }}
    >
      {/* Top glow line */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[1px] z-20"
        animate={{
          background: hovered && !open
            ? `linear-gradient(90deg, transparent 0%, ${borderColor} 50%, transparent 100%)`
            : "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
        }}
        transition={{ duration: 0.4 }}
      />

      {/* Badge */}
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

      <div className={`flex ${open ? "flex-col lg:flex-row lg:min-h-[460px]" : "flex-col"}`}>

        {/* ── LEFT: photo ── */}
        <div className={open ? "relative w-full h-64 lg:h-auto lg:w-64 flex-shrink-0 overflow-hidden" : "relative aspect-[3/4] w-full overflow-hidden"}>
          {judge.image ? (
            <>
              <motion.img
                src={judge.image}
                alt={judge.name}
                className="absolute inset-0 h-full w-full object-cover object-top"
                animate={{ scale: hovered && !open ? 1.04 : 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/20 to-transparent" />
              {!open && (
                <div
                  className="absolute inset-0 transition-opacity duration-500"
                  style={{ opacity: hovered ? 0.15 : 0, background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)` }}
                />
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display font-black text-8xl text-white/5">
              {judge.name?.[0] || "?"}
            </div>
          )}
        </div>

        {/* ── MIDDLE: Instagram-style profile (expanded only) ── */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="ig-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.18 }}
              className="flex-1 flex flex-col p-5 sm:p-8 border-y lg:border-x lg:border-y-0 border-white/5 overflow-y-auto"
            >
              {/* Profile row */}
              <div className="flex items-center gap-5 mb-8">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white/10 ring-offset-2 ring-offset-[#161616]">
                    {judge.image
                      ? <img src={judge.image} alt={judge.name} className="w-full h-full object-cover object-top" />
                      : <div className="w-full h-full bg-white/5 flex items-center justify-center font-display font-black text-2xl text-white/20">{judge.name?.[0]}</div>
                    }
                  </div>
                  {/* Instagram gradient ring on avatar */}
                  <div className="absolute -inset-0.5 rounded-full -z-10 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] opacity-60" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-black uppercase tracking-tight text-2xl text-white leading-tight">{judge.name}</h3>
                  {judge.descriptor && (
                    <div className="font-display font-bold uppercase tracking-widest text-xs text-latent-gold mt-0.5">{judge.descriptor}</div>
                  )}
                  {igHandle && (
                    <a href={igUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-mono text-xs text-white/35 hover:text-[#ee2a7b] transition-colors mt-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                      </svg>
                      {igHandle}
                    </a>
                  )}
                </div>
              </div>

              {/* Stats row — Instagram three-stat style */}
              <div className="flex rounded-xl border border-white/5 overflow-hidden mb-7">
                {[
                  { value: agg.count, label: "jurors" },
                  { value: agg.count > 0 ? agg.avgScore.toFixed(1) : "—", label: "avg score", accent: true },
                  { value: agg.count > 0 && agg.stdDev != null ? agg.stdDev.toFixed(1) : "—", label: "std dev" },
                ].map((s, i) => (
                  <div key={s.label} className={`flex-1 flex flex-col items-center py-4 ${i < 2 ? "border-r border-white/5" : ""}`}>
                    <span className={`font-display font-black text-2xl ${s.accent ? "text-latent-gold" : "text-white"}`}>{s.value}</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/30 mt-0.5">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Bio — Instagram caption style */}
              {judge.bio && (
                <p className="text-sm text-white/60 leading-relaxed mb-6 font-sans">{judge.bio}</p>
              )}

              {/* Descriptor pill */}
              {judge.descriptor && (
                <div className="mb-6">
                  <span className="inline-flex items-center gap-2 bg-latent-gold/8 border border-latent-gold/20 rounded-full px-4 py-1.5">
                    <span className="w-1 h-1 rounded-full bg-latent-gold" />
                    <span className="font-display font-bold uppercase tracking-widest text-xs text-latent-gold">{judge.descriptor}</span>
                  </span>
                </div>
              )}

              {/* Instagram-style grid divider */}
              <div className="flex items-center gap-3 mt-auto mb-4">
                <div className="h-px flex-1 bg-white/5" />
                <svg className="text-white/20" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              {/* Community rating bar */}
              {agg.count > 0 && (
                <RatingBar label="Community Rating" value={agg.avgScore} color="linear-gradient(to right, #D4AF37, #8B1E2D)" />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── RIGHT / COLLAPSED BODY: card info + voting ── */}
        <div className={open ? "w-full lg:w-72 flex-shrink-0 p-6 flex flex-col" : "p-6 flex flex-col flex-1"}>

          {/* Collapsed-only: judge info */}
          {!open && (
            <>
              <h3 className="font-display font-black uppercase tracking-tight text-2xl text-white leading-tight">{judge.name}</h3>
              {judge.descriptor && (
                <div className="font-display font-bold uppercase tracking-widest text-xs text-latent-gold mt-1 mb-1">{judge.descriptor}</div>
              )}
              {igHandle && (
                <a href={igUrl} target="_blank" rel="noreferrer" className="font-mono text-xs text-white/30 hover:text-latent-gold transition-colors">{igHandle}</a>
              )}
              {judge.bio && (
                <p className="text-sm text-white/50 mt-3 leading-relaxed line-clamp-3">{judge.bio}</p>
              )}
              <div className="mt-5 space-y-2">
                <RatingBar label="Community Rating" value={agg.avgScore} color="linear-gradient(to right, #D4AF37, #8B1E2D)" />
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex -space-x-1">
                  {[...Array(Math.min(agg.count, 4))].map((_, i) => (
                    <div key={i} className="w-5 h-5 rounded-full bg-white/10 border border-white/5" aria-hidden />
                  ))}
                </div>
                <span className="font-mono text-[11px] text-white/30">{agg.count} {agg.count === 1 ? "juror" : "jurors"} rated</span>
              </div>
            </>
          )}

          {/* Expanded-only: verdict header */}
          {open && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }} className="mb-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/30 mb-2">Your Verdict</p>
              <div className="h-px bg-gradient-to-r from-latent-crimson/50 via-latent-crimson/20 to-transparent" />
            </motion.div>
          )}

          {/* Rating form — shared */}
          <div className={open ? "flex flex-col flex-1 gap-0" : "mt-5 pt-4 border-t border-white/5"}>
            {!isLoggedIn ? (
              <Link href="/api/auth/signin" className="flex items-center justify-center gap-2 w-full text-center bg-white/5 hover:bg-latent-gold/10 border border-white/10 hover:border-latent-gold/30 text-white/50 hover:text-latent-gold font-display font-black uppercase tracking-widest text-xs py-3 rounded-lg transition-all duration-300">
                <span>⚖</span> Sign in to rate
              </Link>
            ) : (
              <>
                <motion.button
                  onClick={toggleOpen}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full text-center font-display font-black uppercase tracking-widest text-xs py-3 rounded-lg transition-all duration-300 ${
                    open
                      ? "bg-white/5 text-white/40 border border-white/8 mb-4"
                      : "bg-gradient-to-r from-latent-crimson/20 to-latent-gold/10 hover:from-latent-crimson/30 hover:to-latent-gold/20 text-white border border-latent-crimson/30 hover:border-latent-crimson/50 shadow-[0_0_15px_rgba(139,30,45,0.2)] hover:shadow-[0_0_25px_rgba(139,30,45,0.4)]"
                  }`}
                >
                  {open ? "✕ Close" : "⚖ Rate This Judge"}
                </motion.button>

                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: 0.25 }}
                      className="flex flex-col flex-1 gap-3"
                    >
                      {(mine || saved) ? (
                        <div className="text-latent-gold font-mono text-xs bg-latent-gold/5 border border-latent-gold/20 rounded px-3 py-2">
                          ✓ Verdict locked for this episode — one rating per judge, and it can&apos;t be changed.
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-center rounded-xl border border-white/10 bg-[#0A0A0A] py-5 shadow-inner">
                            <ScoreWheel label="Your Score" value={score} onChange={setScore} />
                          </div>
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            maxLength={200}
                            rows={3}
                            placeholder="Optional verdict comment…"
                            className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-3 font-mono text-sm text-white placeholder:text-white/20 focus:border-latent-gold/40 focus:shadow-[0_0_15px_rgba(212,175,55,0.1)] outline-none resize-none transition-all"
                          />
                          {error && (
                            <div className="text-latent-crimson font-mono text-xs bg-latent-crimson/5 border border-latent-crimson/20 rounded px-3 py-2">{error}</div>
                          )}
                          <motion.button
                            onClick={submit}
                            disabled={busy}
                            whileHover={!busy ? { scale: 1.02, boxShadow: "0 0 25px rgba(139,30,45,0.7)" } : {}}
                            whileTap={!busy ? { scale: 0.98 } : {}}
                            className="w-full bg-latent-crimson text-white font-display font-black uppercase tracking-widest py-3 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(139,30,45,0.3)] mt-auto"
                          >
                            {busy ? "Submitting…" : "Lock In Verdict"}
                          </motion.button>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}

export default function JudgePageClient({ judges, myRatings, mostControversialId, fanFavouriteId, dbReady, isLoggedIn, episodes, selectedEpisodeId }) {
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

        <motion.svg
          animate={{ rotate: [-1.5, 1.5, -1.5], y: [-4, 4, -4] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="hidden lg:block absolute left-10 xl:left-24 top-1/2 -mt-[110px] opacity-[0.15]"
          width="220"
          height="220"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#7A5C10"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ 
            transformOrigin: "50% 20%",
            filter: "drop-shadow(0 0 15px rgba(212,175,55,0.4))"
          }}
        >
          <path d="M12 3v18" />
          <path d="M7 21h10" />
          <path d="M5 7h14" />
          <path d="M12 3a2 2 0 1 0 0-.001" />
          <path d="M5 7l-3 6a3 3 0 0 0 6 0L5 7Z" />
          <path d="M19 7l-3 6a3 3 0 0 0 6 0l-3-6Z" />
        </motion.svg>

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

        <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
          {episodes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {episodes.map((ep) => (
                <Link
                  key={ep.id}
                  href={`/panel?episode=${ep.id}`}
                  className={`font-display font-bold uppercase tracking-widest text-xs px-3 py-1.5 rounded-sm border transition-colors ${
                    ep.id === selectedEpisodeId
                      ? "bg-latent-gold/15 text-latent-gold border-latent-gold/50"
                      : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
                  }`}
                >
                  S{ep.season_number}E{ep.episode_number}
                </Link>
              ))}
            </div>
          ) : (
            <div className="font-mono text-sm text-white/30">No episodes to classify judges by yet.</div>
          )}
          <Link href="/judges-scoreboard" className="font-display font-bold uppercase tracking-widest text-xs text-white/50 hover:text-latent-gold transition-colors">
            Judge Popularity →
          </Link>
        </div>

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
                  episodeId={selectedEpisodeId}
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
