"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { submitVote } from "@/app/actions/vote";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, CheckCircle2, Loader2, Target } from "lucide-react";
import { normalizeScore } from "@/lib/utils";
import ScrollDigit from "./ScrollDigit";
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
  { episodeId, contestantId, userVoteScore = null, isEpisodeClosed = false, onRevealClose },
  ref
) {
  const [intPart, setIntPart] = useState(userVoteScore != null ? Math.floor(userVoteScore) : null); // null = untouched, shows "-"
  const [decPart, setDecPart] = useState(userVoteScore != null ? Math.round((userVoteScore % 1) * 10) : null);
  const [hasVoted, setHasVoted] = useState(userVoteScore != null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [revealData, setRevealData] = useState(null); // { userScore } | null

  const touched = intPart !== null && decPart !== null;
  const score = touched ? normalizeScore((intPart ?? 1) + (decPart ?? 0) / 10) : null;

  const lockVote = async () => {
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
    // Show the reveal pop-up with the locked score.
    setRevealData({ userScore: score });
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

  // Voting has closed — show any locked verdict.
  if (isEpisodeClosed) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 py-10 text-center">
        <span className="font-display text-sm uppercase tracking-widest text-white/40">Voting has closed</span>
        {hasVoted && score !== null && (
          <span className="font-display uppercase tracking-widest text-latent-gold">
            Your verdict was locked at {score.toFixed(1)}.
          </span>
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
      </div>

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
        <div className="vote-locked-state flex flex-1 flex-col items-center justify-center gap-4 py-6 text-center">
          <span className="font-display text-xs uppercase tracking-widest text-white/40">
            Your verdict is locked at {score?.toFixed(1)}
          </span>
          <LockButton status="confirmed" />
        </div>
      )}

      {revealData && (
        <VerdictReveal userScore={revealData.userScore} onClose={closeReveal} />
      )}
    </div>
  );
});

function LockButton({ status, onClick }) {
  const confirmed = status === "confirmed";
  
  const content = {
    dormant:    { text: "Set Your Score",   icon: Target       },
    ready:      { text: "Lock My Verdict",  icon: Lock         },
    submitting: { text: "Locking...",       icon: Loader2      },
    confirmed:  { text: "Verdict Locked",   icon: CheckCircle2 },
  };

  const { text, icon: Icon } = content[status] || content.dormant;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={status !== "ready"}
      whileHover={status === "ready" ? { scale: 1.02 } : {}}
      whileTap={status === "ready" ? { scale: 0.98 } : {}}
      className={`relative w-full overflow-hidden rounded-2xl border-2 px-8 py-5 font-display text-xl uppercase tracking-[0.2em] transition-all duration-300 ${
        confirmed
          ? "cursor-default border-latent-gold bg-gradient-to-b from-latent-gold to-[#B8860B] text-[#0A0A0A] hover:shadow-[0_0_20px_rgba(212,175,55,0.5)]"
          : status === "submitting"
          ? "cursor-wait border-latent-crimson/80 bg-latent-crimson/80 text-white"
          : status === "ready"
          ? "cursor-pointer border-latent-crimson bg-gradient-to-b from-latent-crimson to-[#5c131d] text-white hover:shadow-[0_0_20px_rgba(139,30,45,0.6)]"
          : "cursor-not-allowed border-white/10 bg-white/5 text-white/30"
      }`}
    >
      {/* Scanning laser effect for 'ready' state */}
      {status === "ready" && (
        <motion.div
          className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: "-100%", skewX: -20 }}
          animate={{ x: "200%", skewX: -20 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      )}

      <div className="relative z-10 flex items-center justify-center gap-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.2, ease: "backOut" }}
            className="flex items-center gap-3"
          >
            <Icon className={`h-6 w-6 ${status === "submitting" ? "animate-spin" : ""}`} strokeWidth={2.5} />
            <span className="translate-y-[1px]">{text}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

export default LiveVoting;
