"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { submitVote } from "@/app/actions/vote";
import { motion, AnimatePresence } from "framer-motion";
import { normalizeScore } from "@/lib/utils";
import ScrollDigit from "./ScrollDigit";
import RollingNumber from "./RollingNumber";
import VerdictReveal from "./VerdictReveal";

const INT_OPTIONS = [null, ...Array.from({ length: 10 }, (_, i) => i + 1)]; // —,1..10
const DEC_OPTIONS = [null, ...Array.from({ length: 10 }, (_, i) => i)]; // —,0..9

let audioCtx;
function playLockSound() {
  if (typeof window === "undefined") return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    // Deep, heavy "chunk" sound for locking in the vote
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (e) {
    // Ignore if audio not supported/blocked
  }
}

function useCountdown(revealAt) {
  const [remaining, setRemaining] = useState(() => {
    if (!revealAt) return null;
    const diff = new Date(revealAt).getTime() - Date.now();
    return diff > 0 ? diff : 0;
  });

  useEffect(() => {
    if (!revealAt) return;
    const tick = () => {
      const diff = new Date(revealAt).getTime() - Date.now();
      setRemaining(diff > 0 ? diff : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [revealAt]);

  return remaining;
}

function formatCountdown(ms) {
  if (ms <= 0) return null;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

const LiveVoting = forwardRef(function LiveVoting(
  { episodeId, contestantId, initialRawScore = 0, userVoteScore = null, isEpisodeClosed = false, revealAt = null, onRevealClose },
  ref
) {
  const [liveScore, setLiveScore] = useState(initialRawScore || 0);
  const [voterCount, setVoterCount] = useState(0);
  const [intPart, setIntPart] = useState(userVoteScore != null ? Math.floor(userVoteScore) : null); // null = untouched, shows "-"
  const [decPart, setDecPart] = useState(userVoteScore != null ? Math.round((userVoteScore % 1) * 10) : null);
  const [hasVoted, setHasVoted] = useState(userVoteScore != null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [connectionLost, setConnectionLost] = useState(false);
  const [revealData, setRevealData] = useState(null); // { userScore, crowdAverage } | null

  const touched = intPart !== null && decPart !== null;
  const score = touched ? normalizeScore((intPart ?? 1) + (decPart ?? 0) / 10) : null;

  const msRemaining = useCountdown(revealAt);
  const countdownLabel = msRemaining != null ? formatCountdown(msRemaining) : null;
  // Show crowd verdict only if there's no pending reveal countdown
  const showCrowdVerdict = countdownLabel === null;

  useEffect(() => {
    // No live feed needed once voting has closed.
    if (isEpisodeClosed) return;

    const eventSource = new EventSource(`/api/episodes/${episodeId}/live`);
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data));
        if (data.type === "ping") return;
        if (data.type === "LIVE_SCORES") {
          setConnectionLost(false);
          if (data.scores?.[contestantId] !== undefined) {
            setLiveScore(data.scores[contestantId]);
          }
          if (typeof data.voterCount === "number") {
            setVoterCount(data.voterCount);
          }
        }
      } catch (err) {
        console.error("Failed to parse SSE data", err);
      }
    };
    // EventSource auto-reconnects; surface the gap to the user meanwhile.
    eventSource.onerror = () => setConnectionLost(true);
    eventSource.onopen = () => setConnectionLost(false);
    return () => eventSource.close();
  }, [episodeId, contestantId, isEpisodeClosed]);

  const lockVote = async (silent = false) => {
    if (hasVoted || isSubmitting || score === null) return false;
    playLockSound();
    setIsSubmitting(true);
    setError(null);
    const result = await submitVote(episodeId, contestantId, score);
    if (!result.success) {
      if (result.error === "You have already voted for this contestant.") {
        // Fallback lock if they somehow bypass the UI state
        setHasVoted(true);
      } else {
        setError(result.error || "Something went wrong. Try again.");
      }
      setIsSubmitting(false);
      return false;
    }
    setHasVoted(true);
    setIsSubmitting(false);
    if (!silent) setRevealData({ userScore: score, crowdAverage: result.newRawAverage ?? score });
    return true;
  };

  const closeReveal = () => {
    setRevealData(null);
    onRevealClose?.();
  };

  // Lets a master "Lock All" button outside this card trigger it, but only
  // if the user actually changed the value — never lock an untouched "-" card.
  useImperativeHandle(ref, () => ({
    canLock: () => touched && !hasVoted && score !== null,
    lockIfReady: (silent) => lockVote(silent),
  }));

  const handleIntChange = (v) => {
    setIntPart(v);
    if (v === 10) setDecPart(0);
  };

  const handleDecChange = (v) => {
    if (intPart === 10) return;
    setDecPart(v);
  };

  // ── Top strip — countdown to reveal, or live crowd average once past reveal time ──
  const crowdStrip = showCrowdVerdict ? (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-sm border border-brand-border bg-[#0A0A0A] px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-latent-crimson animate-pulse-fast shadow-[0_0_8px_rgba(139,30,45,0.8)]" />
        <span className="font-display text-xs uppercase tracking-widest text-latent-crimson">Crowd Verdict</span>
      </div>
      <div className="flex items-baseline gap-3">
        <RollingNumber value={liveScore || 0} decimals={1} height={34} className="font-bold text-white" />
        <span className="font-number text-sm font-semibold text-white/30">/10</span>
        {voterCount > 0 && (
          <span className="font-number text-[11px] uppercase tracking-widest text-white/30">
            · {voterCount} {voterCount === 1 ? "vote" : "votes"}
          </span>
        )}
      </div>
    </div>
  ) : (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-sm border border-latent-gold/20 bg-[#0A0A0A] px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-latent-gold animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
        <span className="font-display text-xs uppercase tracking-widest text-latent-gold">Reveal In</span>
      </div>
      <span className="font-number text-xl font-bold tracking-widest text-latent-gold tabular-nums">
        {countdownLabel}
      </span>
    </div>
  );

  // Voting has closed — show the final crowd score and any locked verdict.
  if (isEpisodeClosed) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 py-10 text-center">
        <span className="font-display text-sm uppercase tracking-widest text-white/40">Voting has closed</span>
        {hasVoted && score !== null ? (
          <span className="font-display uppercase tracking-widest text-latent-gold">
            Your verdict was locked at {score.toFixed(1)}.
          </span>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="font-display text-sm uppercase tracking-widest text-white/40">Crowd</span>
            <RollingNumber value={liveScore || 0} decimals={1} height={28} className="font-bold text-white" />
            <span className="font-number text-sm font-semibold text-white/30">/10</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 font-display text-sm uppercase tracking-widest text-latent-crimson">
          <span className="h-3 w-3 animate-pulse-fast rounded-full bg-latent-crimson shadow-[0_0_8px_rgba(139,30,45,0.8)]" />
          Live Verdict
        </span>
        {connectionLost && (
          <span className="flex items-center gap-1 font-display text-[10px] uppercase tracking-widest text-latent-gold">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-latent-gold" />
            Reconnecting…
          </span>
        )}
      </div>

      {crowdStrip}

      {!hasVoted ? (
        <>
          <div className="relative flex flex-1 items-center justify-center gap-2 sm:gap-4">
            {/* Ghost preview — assembled score behind the columns, updates live */}
            <AnimatePresence>
              {touched && (
                <motion.div
                  key="ghost"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.12 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
                  aria-hidden
                >
                  <span className="font-number text-[10rem] font-bold leading-none text-latent-gold sm:text-[14rem]">
                    {score?.toFixed(1)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative z-10">
              <ScrollDigit options={INT_OPTIONS} value={intPart} onChange={handleIntChange} disabled={hasVoted} size="lg" />
            </div>
            <span className="relative z-10 font-number text-6xl font-bold text-white/40 sm:text-8xl">.</span>
            <div className="relative z-10">
              <ScrollDigit
                options={DEC_OPTIONS}
                value={decPart}
                onChange={handleDecChange}
                disabled={hasVoted || intPart === 10}
                size="lg"
              />
            </div>
          </div>

          <div className="my-6 text-center font-display text-xs uppercase tracking-widest text-white/40 sm:text-sm">
            {touched
              ? "Scroll to fine-tune your verdict"
              : intPart === null && decPart === null
              ? "Scroll both wheels to set your score"
              : intPart === null
              ? "Now scroll the left wheel to complete your score"
              : "Now scroll the right wheel to complete your score"}
          </div>

          {error && (
            <div className="mb-4 rounded-sm border border-latent-crimson/40 bg-latent-crimson/10 px-4 py-3 text-center font-display text-xs uppercase tracking-widest text-latent-crimson">
              {error}
            </div>
          )}

          {/* Sticky on mobile within the page's scroll container (spec P0.4). */}
          <div className="sticky bottom-3 z-30 sm:static">
            <LockButton
              status={isSubmitting ? "submitting" : score === null ? "dormant" : "ready"}
              onClick={lockVote}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-6 text-center">
          <span className="font-display text-xs uppercase tracking-widest text-white/40">
            Your verdict is locked at {score?.toFixed(1)}
          </span>
          <LockButton status="confirmed" />
        </div>
      )}

      {revealData && (
        <VerdictReveal userScore={revealData.userScore} crowdAverage={revealData.crowdAverage} episodeId={episodeId} onClose={closeReveal} />
      )}
    </div>
  );
});

// Lock button state machine: dormant → ready (hover glow) → submitting → confirmed.
// AnimatePresence mode="wait" lets each label exit before the next enters so the
// swap never jumps (spec P0.4).
function LockButton({ status, onClick }) {
  const confirmed = status === "confirmed";
  const labels = {
    dormant: "Set Your Score",
    ready: "Lock My Verdict",
    submitting: "Locking…",
    confirmed: "Verdict Locked ✓",
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={status !== "ready"}
      whileTap={status === "ready" ? { scale: 0.97 } : undefined}
      animate={confirmed ? { backgroundColor: "rgba(212,175,55,0.15)", borderColor: "rgba(212,175,55,0.6)" } : {}}
      style={{ minHeight: 48 }}
      className={[
        "flex w-full items-center justify-center rounded-sm border px-6 py-3 font-display text-sm sm:text-base uppercase tracking-widest transition-all",
        confirmed
          ? "cursor-default border-latent-gold/60 bg-latent-gold/15 text-latent-gold shadow-[0_0_24px_rgba(212,175,55,0.3)]"
          : status === "submitting"
          ? "cursor-wait border-latent-crimson/80 bg-latent-crimson text-white shadow-[0_0_24px_rgba(139,30,45,0.5)]"
          : status === "dormant"
          ? "cursor-not-allowed border-white/10 bg-latent-crimson/40 text-white/50"
          : "border-latent-crimson/60 bg-latent-crimson text-white hover:shadow-[0_0_28px_rgba(139,30,45,0.65)] active:shadow-[inset_0_0_18px_rgba(0,0,0,0.55)]",
      ].join(" ")}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="flex items-center gap-2"
        >
          {status === "submitting" && (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {labels[status]}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

export default LiveVoting;
