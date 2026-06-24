"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { submitVote } from "@/app/actions/vote";
import { motion } from "framer-motion";
import { normalizeScore } from "@/lib/utils";
import ScrollDigit from "./ScrollDigit";
import VerdictReveal from "./VerdictReveal";

const INT_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1); // 1..10
const DEC_OPTIONS = Array.from({ length: 10 }, (_, i) => i); // 0..9

const LiveVoting = forwardRef(function LiveVoting({ episodeId, contestantId, initialRawScore = 0, isEpisodeClosed = false, onRevealClose }, ref) {
  const [liveScore, setLiveScore] = useState(initialRawScore || 0);
  const [voterCount, setVoterCount] = useState(0);
  const [intPart, setIntPart] = useState(null); // null = untouched, shows "-"
  const [decPart, setDecPart] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [connectionLost, setConnectionLost] = useState(false);
  const [revealData, setRevealData] = useState(null); // { userScore, crowdAverage } | null

  const touched = intPart !== null || decPart !== null;
  const score = touched ? normalizeScore((intPart ?? 1) + (decPart ?? 0) / 10) : null;

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

  const lockVote = async () => {
    if (hasVoted || isSubmitting || score === null) return false;
    setIsSubmitting(true);
    setError(null);
    setHasVoted(true); // optimistic lock
    const result = await submitVote(episodeId, contestantId, score);
    if (!result.success) {
      setError(result.error || "Something went wrong. Try again.");
      setHasVoted(false);
    } else {
      // Show the reveal pop-up with the locked score and the live crowd average.
      setRevealData({ userScore: score, crowdAverage: result.newRawAverage ?? score });
    }
    setIsSubmitting(false);
    return result.success;
  };

  const closeReveal = () => {
    setRevealData(null);
    onRevealClose?.();
  };

  // Lets a master "Lock All" button outside this card trigger it, but only
  // if the user actually changed the value — never lock an untouched "-" card.
  useImperativeHandle(ref, () => ({
    canLock: () => touched && !hasVoted && score !== null,
    lockIfReady: lockVote,
  }));

  const handleIntChange = (v) => {
    setIntPart(v);
    if (decPart === null) setDecPart(0);
    if (v === 10) setDecPart(0); // cap at 10.0, no 10.1+
  };

  const handleDecChange = (v) => {
    if (intPart === 10) return; // locked to .0 at the max
    setDecPart(v);
    if (intPart === null) setIntPart(1);
  };

  // Voting has closed — show the final crowd score and any locked verdict.
  if (isEpisodeClosed) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center text-center gap-3 py-10">
        <span className="font-display font-black text-sm uppercase tracking-widest text-white/40">
          Voting has closed
        </span>
        {hasVoted && score !== null ? (
          <span className="font-display font-black uppercase tracking-widest text-latent-gold">
            Your verdict was locked at {score.toFixed(1)}.
          </span>
        ) : (
          <span className="font-mono font-bold text-white/50 text-sm">
            Crowd: <span className="text-white">{(liveScore || 0).toFixed(1)}</span>/10
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <span className="font-display font-black text-sm uppercase tracking-widest text-latent-crimson flex items-center gap-2">
          <span className="w-3 h-3 bg-latent-crimson rounded-full animate-pulse-fast shadow-[0_0_8px_rgba(139,30,45,0.8)]"></span>
          Live Verdict
        </span>
        <div className="flex flex-col items-end">
          <span className="font-mono font-bold text-white/50 text-sm">
            Crowd: <span className="text-white">{(liveScore || 0).toFixed(1)}</span>/10
          </span>
          {voterCount > 0 && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
              {voterCount} {voterCount === 1 ? "person has" : "people have"} voted
            </span>
          )}
          {connectionLost && (
            <span className="mt-1 font-display font-black text-[10px] uppercase tracking-widest text-latent-gold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-latent-gold rounded-full animate-pulse"></span>
              Reconnecting…
            </span>
          )}
        </div>
      </div>

      {!hasVoted ? (
        <>
          <div className="relative flex items-center justify-center gap-2 sm:gap-4 flex-1">
            <ScrollDigit options={INT_OPTIONS} value={intPart ?? 1} onChange={handleIntChange} size="lg" />
            <span className="font-mono font-black text-6xl sm:text-8xl text-white/40">.</span>
            <ScrollDigit options={DEC_OPTIONS} value={decPart ?? 0} onChange={handleDecChange} disabled={intPart === 10} size="lg" />

            {/* Default state: "-" overlay, fades out on first touch; scroll passes through underneath */}
            {!touched && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="font-mono font-black text-9xl sm:text-[12rem] leading-none text-white/20">—</span>
              </div>
            )}
          </div>
          <div className="text-xs sm:text-sm font-display font-black uppercase tracking-widest text-white/40 text-center my-6">
            {touched ? "Scroll to fine-tune your verdict" : "Scroll either wheel to set your score"}
          </div>

          {error && (
            <div className="mb-4 rounded-sm border border-latent-crimson/40 bg-latent-crimson/10 px-4 py-3 text-center font-display font-bold uppercase tracking-widest text-xs text-latent-crimson">
              {error}
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={lockVote}
            disabled={isSubmitting || score === null}
            className="w-full bg-latent-crimson text-white font-display font-black uppercase tracking-widest py-5 text-lg rounded-sm hover:shadow-[0_0_20px_rgba(139,30,45,0.6)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? "Locking..." : "Lock My Verdict"}
          </motion.button>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center text-latent-gold font-display font-black uppercase tracking-widest text-lg">
          Verdict Locked at {score.toFixed(1)}. Wait for the reveal.
        </div>
      )}

      {revealData && (
        <VerdictReveal
          userScore={revealData.userScore}
          crowdAverage={revealData.crowdAverage}
          onClose={closeReveal}
        />
      )}
    </div>
  );
});

export default LiveVoting;
