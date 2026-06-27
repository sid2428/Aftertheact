// voting-wheel/layout.js
// Renders without the standard MainNav + footer chrome.
// The VotingScoreWheel component provides its own header bar.

export const metadata = {
  title: "Cast Your Verdict — After The Act",
  description: "Score the act with the live verdict wheel.",
  // Interactive utility view (chrome-less voting wheel), not a content page —
  // keep it out of the index to avoid thin/duplicate results.
  robots: { index: false, follow: false },
};

export default function VotingWheelLayout({ children }) {
  return children;
}
