// Layout wrapper for the revealed lineup. The per-card entrance animation lives
// in RevealOnView (inside ContestantCard), which reveals reliably on scroll with
// a fallback — so this layer is intentionally a plain, always-visible grid. It no
// longer gates the whole lineup behind a single opacity animation that could leave
// the page blank if it failed to run.
import React from "react";

export default function RevelationSequence({ children, isRevealed }) {
  return (
    <div
      className={`flex snap-x snap-mandatory overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:gap-6 sm:grid-cols-2 lg:grid-cols-2 gap-4 ${
        isRevealed ? "sm:glass-surface sm:rounded-[2rem] sm:p-8" : ""
      }`}
    >
      {/* We wrap each child in a shrink-0 snap-center container on mobile */}
      {React.Children.map(children, (child, i) => (
        <div key={i} className="w-[90vw] sm:w-auto shrink-0 snap-center sm:snap-align-none">
          {child}
        </div>
      ))}
    </div>
  );
}

// Kept as a pass-through so existing imports/usage stay valid.
export function RevelationItem({ children }) {
  return children;
}
