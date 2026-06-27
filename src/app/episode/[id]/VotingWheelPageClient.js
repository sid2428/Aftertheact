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
  const [allDone, setAllDone] = useState(false);
  const router = useRouter();
  const c = contestants[idx];

  const handleVoteLocked = () => {

    if (idx < contestants.length - 1) {
      // Small delay so the LOCKED stamp animation finishes before advancing
      setTimeout(() => setIdx((prev) => prev + 1), 1800);
    } else {
      // Show a completion message over the LOCKED stamp before leaving the wheel.
      setAllDone(true);
      setTimeout(() => router.push("/scoreboard"), 1800);
    }
  };

  return (
    <>
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
    </>
  );
}
