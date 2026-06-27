"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import VotingScoreWheel from "@/components/VotingScoreWheel";

/**
 * Renders VotingScoreWheel directly for each contestant in the episode.
 * When a verdict is locked and there are more contestants, advances to the next one.
 */
export default function VotingWheelPageClient({
  contestants,
  episodeId,
  revealAt,
  seasonLabel,
  showTitle,
  isAuthenticated = false,
}) {
  const [idx, setIdx] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animDirection, setAnimDirection] = useState(""); // "next" or "prev"
  const [allDone, setAllDone] = useState(false);
  const router = useRouter();
  const c = contestants[idx];

  const handleVoteLocked = () => {
    if (idx < contestants.length - 1) {
      setTimeout(() => goToNext(), 1800);
    } else {
      // Show a completion message over the LOCKED stamp before leaving the wheel.
      setAllDone(true);
      setTimeout(() => router.push("/scoreboard"), 1800);
    }
  };

  const goToNext = () => {
    if (idx >= contestants.length - 1 || isAnimating) return;
    setAnimDirection("next");
    setIsAnimating(true);
    setTimeout(() => {
      setIdx((prev) => prev + 1);
      setIsAnimating(false);
      setAnimDirection("");
    }, 600); // Wait for the 600ms dice roll animation
  };

  const goToPrev = () => {
    if (idx <= 0 || isAnimating) return;
    setAnimDirection("prev");
    setIsAnimating(true);
    setTimeout(() => {
      setIdx((prev) => prev - 1);
      setIsAnimating(false);
      setAnimDirection("");
    }, 600);
  };

  // Determine the wrapper class for animation
  const wrapperClass = isAnimating
    ? animDirection === "next"
      ? "animate-dice-next"
      : "animate-dice-prev"
    : "";

  return (
    <div className="relative w-full h-full min-h-[100dvh] flex items-center justify-center bg-brand-bg overflow-hidden">
      {/* Previous Arrow */}
      {idx > 0 && (
        <button
          onClick={goToPrev}
          disabled={isAnimating}
          className="absolute left-2 md:left-12 top-32 md:top-1/2 md:-translate-y-1/2 z-50 p-3 md:p-4 rounded-full bg-brand-panel/50 hover:bg-brand-panel text-white/50 hover:text-white border border-white/10 hover:border-white/20 transition-all backdrop-blur-md"
          aria-label="Previous Contestant"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      )}

      {/* Main Wheel Container */}
      <div className={`w-full max-w-5xl transition-transform ${wrapperClass}`}>
        <VotingScoreWheel
          key={c.id}                    // remount wheel completely on contestant change
          act={{
            name: c.name,
            tagline: c.tagline,
            initial: c.initial,
          }}
          episodeId={episodeId}
          contestantId={c.id}
          revealAt={revealAt}
          userVoteScore={c.userVoteScore}
          isEpisodeClosed={false}
          isAuthenticated={isAuthenticated}
          seasonLabel={
            contestants.length > 1
              ? `${seasonLabel} · ${idx + 1} / ${contestants.length}`
              : seasonLabel
          }
          showTitle={showTitle}
          onVoteLocked={handleVoteLocked}
        />
      </div>

      {/* Next Arrow */}
      {idx < contestants.length - 1 && (
        <button
          onClick={goToNext}
          disabled={isAnimating}
          className="absolute right-2 md:right-12 top-32 md:top-1/2 md:-translate-y-1/2 z-50 p-3 md:p-4 rounded-full bg-brand-panel/50 hover:bg-brand-panel text-white/50 hover:text-white border border-white/10 hover:border-white/20 transition-all backdrop-blur-md"
          aria-label="Next Contestant"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      )}

      {allDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md px-6">
          <div className="text-center">
            <div className="font-display font-black uppercase tracking-widest text-3xl sm:text-4xl text-latent-gold drop-shadow-[0_0_20px_rgba(212,175,55,0.5)]">
              All Verdicts Locked
            </div>
            <p className="mt-3 text-sm text-white/60 uppercase tracking-widest">
              Heading to the Scoreboard&hellip;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
