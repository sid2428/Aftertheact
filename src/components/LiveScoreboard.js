"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, useReducedMotion } from "framer-motion";
import ScoreboardRow from "./ScoreboardRow";

// How long the board "winds up" — telegraphing a rank swap — before the rows
// actually glide to their new order.
const ANTICIPATION_MS = 420;

// The live leaderboard. Rows glide to new positions on score changes via Framer
// Motion FLIP (`layout` + `LayoutGroup`); scores roll rather than snap. Three
// modes (spec P0.3):
//   • revealOnMount — archived "results reveal": scores count up from zero with
//     an earliest-first stagger.
//   • liveEpisodeId — subscribes to the existing SSE feed; incoming scores
//     re-sort the board and flash rank changes.
//   • compact — top-N rows, no vote bars (used by the homepage split panel).
export default function LiveScoreboard({
  rows = [],
  liveEpisodeId = null,
  revealOnMount = false,
  compact = false,
  topN = null,
  startRank = 1,
  ariaLabel = "Live leaderboard",
}) {
  const reduced = useReducedMotion();
  const doReveal = revealOnMount && !reduced;

  const rowsKey = useMemo(() => rows.map((r) => r.id).join("|"), [rows]);
  const baseScores = useMemo(() => Object.fromEntries(rows.map((r) => [r.id, r.score ?? 0])), [rows]);
  const zeroScores = useMemo(() => Object.fromEntries(rows.map((r) => [r.id, 0])), [rows]);

  const [scores, setScores] = useState(() => (doReveal ? zeroScores : baseScores));
  const [flashes, setFlashes] = useState({});
  const [leaderBeatId, setLeaderBeatId] = useState(null);
  const prevRanks = useRef({});
  const prevLeaderId = useRef(null);
  const flashTimers = useRef({});
  const leaderBeatTimer = useRef(null);
  const reorderTimer = useRef(null);

  // Mirror current scores into a ref so the SSE handler can diff against them
  // without re-subscribing.
  const scoresRef = useRef(scores);
  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);

  // Reset scores when the rows prop changes — React's render-phase pattern,
  // which avoids the cascading renders of a sync effect.
  const [trackedKey, setTrackedKey] = useState(rowsKey);
  if (rowsKey !== trackedKey) {
    setTrackedKey(rowsKey);
    setScores(doReveal ? zeroScores : baseScores);
    setLeaderBeatId(null);
  }

  useEffect(() => {
    prevLeaderId.current = null;
  }, [rowsKey]);

  // Dramatic reveal — ramp each score 0 → target, earliest rows first. The
  // setState calls live inside timer callbacks, not the effect body.
  useEffect(() => {
    if (!doReveal) return;
    const revealOrder = [...rows].sort((a, b) => (baseScores[a.id] ?? 0) - (baseScores[b.id] ?? 0));
    const leaderId = revealOrder.at(-1)?.id ?? null;
    const totalDuration = 4000;
    const interval = revealOrder.length > 1 ? totalDuration / (revealOrder.length - 1) : 0;
    
    const timers = revealOrder.map((r, i) =>
      setTimeout(() => {
        setScores((prev) => ({ ...prev, [r.id]: baseScores[r.id] }));
        if (r.id === leaderId) {
          setLeaderBeatId(r.id);
          clearTimeout(leaderBeatTimer.current);
          leaderBeatTimer.current = setTimeout(() => setLeaderBeatId(null), 1400);
        }
      }, i * interval)
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowsKey, doReveal]);

  // Live mode — reuse the per-episode SSE feed; updates re-sort the board and
  // flash rank changes. All state writes happen in the message callback.
  useEffect(() => {
    if (!liveEpisodeId) return;
    prevRanks.current = {}; // re-baseline ranks for this episode/row set
    const es = new EventSource(`/api/episodes/${liveEpisodeId}/live`);
    es.onmessage = (e) => {
      let data;
      try {
        data = JSON.parse(String(e.data));
      } catch {
        return;
      }
      if (data.type !== "LIVE_SCORES" || !data.scores) return;

      const nextScores = { ...scoresRef.current, ...data.scores };

      // Detect rank changes against the previous order.
      const order = [...rows].sort((a, b) => (nextScores[b.id] ?? 0) - (nextScores[a.id] ?? 0));
      const nextLeaderId = order[0]?.id ?? null;
      const nextRanks = {};
      order.forEach((r, i) => {
        nextRanks[r.id] = i;
      });
      const newFlashes = {};
      for (const id in nextRanks) {
        const before = prevRanks.current[id];
        if (before !== undefined && before !== nextRanks[id]) {
          newFlashes[id] = nextRanks[id] < before ? "up" : "down";
        }
      }

      const leaderChanged =
        nextLeaderId && prevLeaderId.current && prevLeaderId.current !== nextLeaderId;
      const hasRankChange = Object.keys(newFlashes).length > 0;

      // The #1-change beat is the most intense version of the row treatment and
      // is reserved for the very top changing hands — it plays with the reorder
      // payoff, not before it.
      const fireLeaderBeat = () => {
        if (!leaderChanged || reduced) return;
        setLeaderBeatId(nextLeaderId);
        clearTimeout(leaderBeatTimer.current);
        leaderBeatTimer.current = setTimeout(() => setLeaderBeatId(null), 1600);
      };

      const flashAndClear = () => {
        setFlashes((f) => ({ ...f, ...newFlashes }));
        for (const id in newFlashes) {
          clearTimeout(flashTimers.current[id]);
          flashTimers.current[id] = setTimeout(() => {
            setFlashes((f) => {
              const c = { ...f };
              delete c[id];
              return c;
            });
          }, 1400);
        }
      };

      const commit = () => {
        prevRanks.current = nextRanks;
        setScores(nextScores);
        fireLeaderBeat();
        prevLeaderId.current = nextLeaderId;
      };

      // No reorder (or reduced-motion): apply numbers immediately, no beat.
      if (!hasRankChange || reduced) {
        commit();
        return;
      }

      // Anticipation → payoff: telegraph the move (direction arrow + flash) a
      // beat before the rows actually glide to their new positions, so a rank
      // swap feels choreographed rather than snapping the instant scores arrive.
      flashAndClear();
      clearTimeout(reorderTimer.current);
      reorderTimer.current = setTimeout(commit, ANTICIPATION_MS);
    };
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveEpisodeId, rowsKey]);

  useEffect(() => () => {
    Object.values(flashTimers.current).forEach(clearTimeout);
    clearTimeout(leaderBeatTimer.current);
    clearTimeout(reorderTimer.current);
  }, []);

  const sorted = useMemo(() => {
    const arr = [...rows].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
    return topN ? arr.slice(0, topN) : arr;
  }, [rows, scores, topN]);

  // Top score, used to normalise each row's magnitude bar (avoid /0).
  const maxScore = useMemo(
    () => Math.max(1, ...rows.map((r) => scores[r.id] ?? 0)),
    [rows, scores]
  );

  if (!rows.length) {
    return (
      <div className="rounded-md border border-dashed border-white/10 py-12 text-center font-display uppercase tracking-widest text-white/30">
        No scores yet.
      </div>
    );
  }

  return (
    <div role="list" aria-label={ariaLabel} aria-live="polite" className="flex flex-col gap-1.5">
      <LayoutGroup>
        <AnimatePresence initial={false}>
          {sorted.map((row, i) => (
            <ScoreboardRow
              key={row.id}
              row={row}
              rank={startRank + i}
              score={scores[row.id] ?? 0}
              scorePct={(scores[row.id] ?? 0) / maxScore}
              flash={flashes[row.id] || null}
              leaderBeat={leaderBeatId === row.id}
              compact={compact}
              reduced={reduced}
            />
          ))}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}
