"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { submitVote } from "@/app/actions/vote";
import { motion } from "framer-motion";
import { normalizeScore } from "@/lib/utils";
import ScrollDigit from "./ScrollDigit";

const INT_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1); // 1..10
const DEC_OPTIONS = Array.from({ length: 10 }, (_, i) => i); // 0..9

const LiveVoting = forwardRef(function LiveVoting({ episodeId, contestantId, initialRawScore = 0 }, ref) {
  const [liveScore, setLiveScore] = useState(initialRawScore || 0);
  const [intPart, setIntPart] = useState(null); // null = untouched, shows "-"
  const [decPart, setDecPart] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const touched = intPart !== null || decPart !== null;
  const score = touched ? normalizeScore((intPart ?? 1) + (decPart ?? 0) / 10) : null;

  useEffect(() => {
    const eventSource = new EventSource(`/api/episodes/${episodeId}/live`);
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "LIVE_SCORES" && data.scores[contestantId] !== undefined) {
          setLiveScore(data.scores[contestantId]);
        }
      } catch (err) {
        console.error("Failed to parse SSE data", err);
      }
    };
    return () => eventSource.close();
  }, [episodeId, contestantId]);

  const lockVote = async () => {
    if (hasVoted || isSubmitting || score === null) return false;
    setIsSubmitting(true);
    setHasVoted(true); // optimistic lock
    const result = await submitVote(episodeId, contestantId, score);
    if (!result.success) {
      alert(result.error);
      setHasVoted(false);
    }
    setIsSubmitting(false);
    return result.success;
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

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <span className="font-display font-black text-sm uppercase tracking-widest text-latent-crimson flex items-center gap-2">
          <span className="w-3 h-3 bg-latent-crimson rounded-full animate-pulse-fast shadow-[0_0_8px_rgba(139,30,45,0.8)]"></span>
          Live Verdict
        </span>
        <span className="font-mono font-bold text-white/50 text-sm">
          Crowd: <span className="text-white">{(liveScore || 0).toFixed(1)}</span>/10
        </span>
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

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={lockVote}
            disabled={isSubmitting || score === null}
            className="w-full bg-latent-crimson text-white font-display font-black uppercase tracking-widest py-5 text-lg rounded-sm hover:shadow-[0_0_20px_rgba(139,30,45,0.6)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? "Locking..." : "Lock Vote"}
          </motion.button>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center text-latent-gold font-display font-black uppercase tracking-widest text-lg">
          Vote Locked at {score.toFixed(1)}. Wait for the reveal.
        </div>
      )}
    </div>
  );
});

export default LiveVoting;
