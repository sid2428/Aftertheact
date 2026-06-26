"use client";

import VotingScoreWheel from "@/components/VotingScoreWheel";

// Thin client boundary wrapper — passes all props straight through.
// Kept separate so the page.js (Server Component) can do async data fetching.
export default function VotingScoreWheelClient(props) {
  return <VotingScoreWheel {...props} />;
}
