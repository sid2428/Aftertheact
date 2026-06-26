"use client";

import { useState } from "react";
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
  const c = contestants[idx];

  const handleVoteLocked = () => {

    if (idx < contestants.length - 1) {
      // Small delay so the LOCKED stamp animation finishes before advancing
      setTimeout(() => setIdx((prev) => prev + 1), 1800);
    }
  };

  return (
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
  );
}
