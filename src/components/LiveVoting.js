"use client";

import { useState, useEffect } from "react";
import { submitVote } from "@/app/actions/vote";
import { motion, animate } from "framer-motion";
import { cn } from "@/lib/utils";

export default function LiveVoting({ episodeId, contestantId, initialRawScore = 0 }) {
  const [liveScore, setLiveScore] = useState(initialRawScore);
  const [displayScore, setDisplayScore] = useState(initialRawScore);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Smoothly animate the display score to match the live score
  useEffect(() => {
    const controls = animate(displayScore, liveScore, {
      duration: 0.8,
      type: "spring",
      bounce: 0.2,
      onUpdate(value) {
        setDisplayScore(value);
      }
    });
    return () => controls.stop();
  }, [liveScore]);

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

    return () => {
      eventSource.close();
    };
  }, [episodeId, contestantId]);

  const handleVote = async (score) => {
    if (hasVoted || isSubmitting) return;
    setIsSubmitting(true);
    
    // Optimistic UI update
    setHasVoted(true);

    const result = await submitVote(episodeId, contestantId, score);
    if (!result.success) {
      alert(result.error);
      setHasVoted(false);
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="bg-brand-gray/50 border-4 border-brand-black p-4 mt-4">
      <div className="flex justify-between items-end mb-2">
        <span className="font-display font-black text-sm uppercase tracking-widest text-broadcast-red flex items-center gap-2">
          <span className="w-3 h-3 bg-broadcast-red animate-pulse-fast"></span>
          Live Verdict
        </span>
        <span className="font-mono font-black text-4xl leading-none">
          {displayScore.toFixed(1)}<span className="text-xl text-brand-black/50">/10</span>
        </span>
      </div>
      
      {/* Spring Physics Progress Bar */}
      <div className="w-full bg-brand-black/10 h-4 border-y-2 border-brand-black/20 mb-6 overflow-hidden relative">
        <motion.div 
          className="bg-broadcast-red h-full absolute left-0 top-0"
          initial={{ width: `${initialRawScore * 10}%` }}
          animate={{ width: `${liveScore * 10}%` }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
        />
      </div>

      {!hasVoted ? (
        <>
          <div className="grid grid-cols-5 gap-2">
            {[1, 3, 5, 7, 10].map((score) => (
              <motion.button 
                key={score} 
                whileTap={{ scale: 0.9, backgroundColor: "#E53935", color: "#FFF" }}
                onClick={() => handleVote(score)}
                disabled={isSubmitting}
                className={cn(
                  "py-4 bg-brand-black text-white font-mono font-black text-xl border-b-4 border-black/50 transition-colors",
                  "hover:bg-brand-black/90 disabled:opacity-50 disabled:cursor-not-allowed",
                  score === 10 && "text-broadcast-red"
                )}
              >
                {score}
              </motion.button>
            ))}
          </div>
          <div className="text-xs font-display font-bold uppercase tracking-widest text-brand-black/50 text-center mt-3 flex justify-between px-2">
            <span>Why apply?</span>
            <span>Legend</span>
          </div>
        </>
      ) : (
        <div className="text-center py-4 bg-brand-black text-white font-display font-black uppercase tracking-widest text-sm border-2 border-brand-black">
          Vote Locked. Wait for the final reveal.
        </div>
      )}
    </div>
  );
}
