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
    <div className="bg-[#0A0A0A] border border-latent-crimson/30 rounded-md p-4 mt-4 shadow-[0_0_20px_rgba(139,30,45,0.15)] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-latent-crimson/50" />
      <div className="flex justify-between items-end mb-2 relative z-10">
        <span className="font-display font-black text-sm uppercase tracking-widest text-latent-crimson flex items-center gap-2">
          <span className="w-3 h-3 bg-latent-crimson rounded-full animate-pulse-fast shadow-[0_0_8px_rgba(139,30,45,0.8)]"></span>
          Live Verdict
        </span>
        <span className="font-mono font-black text-4xl leading-none text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
          {(displayScore || 0).toFixed(1)}<span className="text-xl text-white/30">/10</span>
        </span>
      </div>
      
      {/* Spring Physics Progress Bar */}
      <div className="w-full bg-[#111111] h-4 border-y border-white/10 mb-6 overflow-hidden relative rounded-sm z-10">
        <motion.div 
          className="bg-latent-crimson h-full absolute left-0 top-0 shadow-[0_0_15px_rgba(139,30,45,0.8)]"
          initial={{ width: `${initialRawScore * 10}%` }}
          animate={{ width: `${liveScore * 10}%` }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
        />
      </div>

      {!hasVoted ? (
        <>
          <div className="grid grid-cols-5 gap-2 relative z-10">
            {[1, 3, 5, 7, 10].map((score) => (
              <motion.button 
                key={score} 
                whileTap={{ scale: 0.9, backgroundColor: "#8B1E2D", color: "#FFF", borderColor: "#8B1E2D" }}
                onClick={() => handleVote(score)}
                disabled={isSubmitting}
                className={cn(
                  "py-4 bg-[#111111] text-white font-mono font-black text-xl border border-brand-border rounded-sm transition-all",
                  "hover:bg-[#1A1A1A] hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed",
                  score === 10 && "text-latent-gold border-latent-gold/30 hover:border-latent-gold/60"
                )}
              >
                {score}
              </motion.button>
            ))}
          </div>
          <div className="text-xs font-display font-bold uppercase tracking-widest text-white/40 text-center mt-3 flex justify-between px-2 relative z-10">
            <span>Why apply?</span>
            <span>Legend</span>
          </div>
        </>
      ) : (
        <div className="text-center py-4 bg-[#111111] text-latent-gold font-display font-black uppercase tracking-widest text-sm border border-latent-gold/30 rounded-sm relative z-10 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
          Vote Locked. Wait for the final reveal.
        </div>
      )}
    </div>
  );
}
