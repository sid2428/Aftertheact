"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ScrollDigit from "./ScrollDigit";

const OVERALL_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1); // 1..10

function RatingBar({ label, value, color }) {
  const pct = Math.max(0, Math.min(100, (value / 10) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between font-display font-black uppercase tracking-widest text-[10px] text-white/50">
        <span>{label}</span>
        <span className="font-mono text-white/80">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function JudgeCard({ judge, badge, mine, isLoggedIn, episodeId }) {
  const [agg, setAgg] = useState(judge.agg);
  const [open, setOpen] = useState(false);
  const [overall, setOverall] = useState(mine?.overall ?? 5);
  const [tag, setTag] = useState(mine?.tag ?? null);
  const [comment, setComment] = useState(mine?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const submit = async () => {
    if (busy || !tag || !episodeId) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/judges/${encodeURIComponent(judge.id)}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overall, tag, comment, episodeId }),
    });
    const json = await res.json();
    if (json.success) {
      setAgg(json.data);
      setSaved(true);
    } else {
      setError(json.error || "Failed to submit.");
    }
    setBusy(false);
  };

  return (
    <div className="bg-[#111111] border border-white/10 rounded-md p-6 flex flex-col">
      {badge && (
        <span className={`self-start mb-3 text-[10px] font-display font-black uppercase tracking-widest px-2 py-1 rounded-sm border ${
          badge === "controversial"
            ? "bg-latent-crimson/15 text-latent-crimson border-latent-crimson/40"
            : "bg-latent-gold/15 text-latent-gold border-latent-gold/40"
        }`}>
          {badge === "controversial" ? "Most Controversial" : "Fan Favourite"}
        </span>
      )}

      <div className="w-full h-64 mb-4 flex items-end justify-center overflow-hidden">
        {judge.image ? (
          <img src={judge.image} alt={judge.name} className="h-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]" />
        ) : (
          <div className="w-40 h-full bg-[#0A0A0A] rounded-md flex items-center justify-center font-display font-black text-6xl text-white/10">{judge.name?.[0] || "?"}</div>
        )}
      </div>

      <h3 className="font-display font-black uppercase tracking-tight text-2xl text-white">{judge.name}</h3>
      {judge.descriptor && <div className="font-display font-bold uppercase tracking-widest text-xs text-latent-gold mb-1">{judge.descriptor}</div>}
      {judge.instagram_handle && (
        <a href={`https://instagram.com/${judge.instagram_handle.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-white/40 hover:text-latent-gold transition-colors">{judge.instagram_handle}</a>
      )}
      {judge.bio && <p className="text-sm text-white/60 mt-2 leading-relaxed">{judge.bio}</p>}

      <div className="space-y-3 mt-5">
        <RatingBar label="Overall" value={agg.avgOverall} color="linear-gradient(to right, #D4AF37, transparent)" />
        {agg.topTag && (
          <span className="inline-block text-[10px] font-display font-black uppercase tracking-widest bg-latent-crimson/15 text-latent-crimson px-2 py-1 border border-latent-crimson/30 rounded-sm">
            {agg.topTag}
          </span>
        )}
      </div>

      <div className="font-mono text-[11px] text-white/40 mt-3">Rated by {agg.count} {agg.count === 1 ? "juror" : "jurors"} this episode</div>

      {/* Rating form */}
      <div className="mt-4 pt-4 border-t border-white/5">
        {!episodeId ? (
          <div className="text-center text-white/30 font-mono text-xs py-2.5">No episode to rate yet.</div>
        ) : !isLoggedIn ? (
          <Link href="/api/auth/signin" className="block text-center bg-white/5 hover:bg-white/10 text-white/70 font-display font-black uppercase tracking-widest text-xs py-2.5 rounded-sm transition-colors">
            Sign in to rate the judges
          </Link>
        ) : (
          <>
            <button
              onClick={() => setOpen((o) => !o)}
              className="w-full text-center bg-white/5 hover:bg-white/10 text-white font-display font-black uppercase tracking-widest text-xs py-2.5 rounded-sm transition-colors"
            >
              {open ? "Close" : "Rate This Judge"}
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 pt-4">
                    {mine && !saved && (
                      <div className="font-mono text-[11px] text-latent-gold">You&apos;ve already rated this judge. Submit to update your rating.</div>
                    )}

                    <div className="flex flex-col items-center">
                      <span className="font-display font-black uppercase tracking-widest text-xs text-white/60 mb-1">Overall</span>
                      <ScrollDigit options={OVERALL_OPTIONS} value={overall} onChange={setOverall} size="md" />
                    </div>

                    <div>
                      <span className="font-display font-black uppercase tracking-widest text-xs text-white/60 mb-2 block">Pick a vibe</span>
                      <div className="flex flex-wrap gap-2">
                        {judge.tags.map((t) => (
                          <button
                            key={t}
                            onClick={() => setTag(t)}
                            className={`text-[11px] font-display font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm border transition-colors ${
                              tag === t
                                ? "bg-latent-gold/15 text-latent-gold border-latent-gold/50"
                                : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      maxLength={200}
                      rows={2}
                      placeholder="Optional comment…"
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm p-2 font-mono text-sm text-white placeholder:text-white/30 focus:border-latent-gold/50 outline-none resize-none"
                    />
                    {error && <div className="text-latent-crimson font-mono text-xs">{error}</div>}
                    {saved && <div className="text-latent-gold font-mono text-xs">Rating saved ✓</div>}
                    <button
                      onClick={submit}
                      disabled={busy || !tag}
                      className="w-full bg-latent-crimson text-white font-display font-black uppercase tracking-widest py-3 rounded-sm hover:shadow-[0_0_20px_rgba(139,30,45,0.6)] transition-all disabled:opacity-50"
                    >
                      {busy ? "Submitting…" : "Submit Rating"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

export default function JudgePageClient({ judges, myRatings, mostControversialId, fanFavouriteId, dbReady, isLoggedIn, episodes, selectedEpisodeId }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[45vh] flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,_var(--tw-gradient-stops))] from-latent-gold/8 via-transparent to-transparent pointer-events-none" />
        {/* Scales of justice */}
        <svg className="hidden lg:block absolute left-10 xl:left-24 top-1/2 -translate-y-1/2 opacity-20" width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v18" /><path d="M7 21h10" /><path d="M5 7h14" /><path d="M12 3a2 2 0 1 0 0-.001" />
          <path d="M5 7l-3 6a3 3 0 0 0 6 0L5 7Z" /><path d="M19 7l-3 6a3 3 0 0 0 6 0l-3-6Z" />
        </svg>

        <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-12 relative z-10 lg:text-right">
          <h1 className="text-6xl sm:text-8xl font-display font-black tracking-tighter uppercase text-white leading-[0.85]">
            JUDGE THE<br />JUDGES
          </h1>
          <p className="text-xl text-white/60 font-medium mt-4">The jury is now on trial.</p>
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {judges.map((j) => (
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
        )}
      </div>
    </div>
  );
}
