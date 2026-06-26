"use client";

import { useState } from "react";
import { submitPredictions } from "@/app/actions/predictions";
import { ORACLE_SCORING } from "@/lib/scoring";

export default function PredictionGame({ episodeId, contestants, existingPrediction }) {
  const [topId, setTopId] = useState(existingPrediction?.predicted_top_contestant_id || "");
  const [bottomId, setBottomId] = useState(existingPrediction?.predicted_bottom_contestant_id || "");
  const [alignment, setAlignment] = useState(existingPrediction?.predicted_alignment !== undefined ? existingPrediction.predicted_alignment : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(!!existingPrediction);

  const handleLock = async () => {
    if (!topId || !bottomId || alignment === null) {
      alert("You must answer all 3 questions to lock your Oracle Board prediction.");
      return;
    }
    if (topId === bottomId) {
      alert("Top and Bottom contestants cannot be the same person.");
      return;
    }

    setIsSubmitting(true);
    const res = await submitPredictions({ episodeId, topId, bottomId, alignment });
    if (res.success) {
      setIsLocked(true);
    } else {
      alert(res.error);
    }
    setIsSubmitting(false);
  };

  const choiceClass = (active, tone = "red") => {
    if (active && tone === "gold") {
      return "border-oracle-gold bg-[#120f02] text-oracle-gold shadow-[4px_4px_0px_0px_#E53935]";
    }
    if (active) {
      return "border-broadcast-red bg-broadcast-red text-white shadow-[4px_4px_0px_0px_#D4AF37]";
    }
    return "border-white/15 bg-[#080808] text-white/50 hover:border-broadcast-red hover:text-white disabled:opacity-40";
  };

  return (
    <div className="brutal-surface-lg relative overflow-hidden bg-brand-panel p-6 text-white sm:p-10">
      <div className="absolute left-0 top-0 h-2 w-full bg-broadcast-red" />
      <div className="relative z-10 mb-8 border-b-4 border-white/10 pb-4">
        <h2 className="font-display text-4xl font-black uppercase tracking-tight text-white">The Oracle Board</h2>
        <p className="mt-2 font-medium text-white/60">
          Lock in your predictions. Your Oracle Score is permanent. Choose wisely.
        </p>
      </div>

      <div className="relative z-10 space-y-8">
        <div>
          <label className="mb-3 block font-display text-sm font-black uppercase tracking-widest text-oracle-gold">
            1. Who will top the episode?
          </label>
          <div className="relative">
            <select
              disabled={isLocked}
              value={topId}
              onChange={(e) => setTopId(e.target.value)}
              className="w-full appearance-none border-4 border-white/15 bg-[#080808] p-4 font-display font-bold uppercase text-white transition-colors focus:border-oracle-gold focus:outline-none disabled:opacity-50"
            >
              <option value="" disabled>Select the Latent Legend...</option>
              {contestants.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-oracle-gold">
              V
            </div>
          </div>
        </div>

        <div>
          <label className="mb-3 block font-display text-sm font-black uppercase tracking-widest text-white/70">
            2. Who will bottom the episode?
          </label>
          <div className="relative">
            <select
              disabled={isLocked}
              value={bottomId}
              onChange={(e) => setBottomId(e.target.value)}
              className="w-full appearance-none border-4 border-white/15 bg-[#080808] p-4 font-display font-bold uppercase text-white transition-colors focus:border-oracle-gold focus:outline-none disabled:opacity-50"
            >
              <option value="" disabled>Select the Rock Bottom...</option>
              {contestants.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-oracle-gold">
              V
            </div>
          </div>
        </div>

        <div>
          <label className="mb-3 block font-display text-sm font-black uppercase tracking-widest text-white/70">
            3. Will Judges & Audience Agree? (Divergence &lt; {ORACLE_SCORING.ALIGNMENT_MARGIN})
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <button
              disabled={isLocked}
              onClick={() => setAlignment("HARSH")}
              className={`border-4 py-4 font-display font-black uppercase tracking-widest transition-all ${choiceClass(alignment === "HARSH")}`}
            >
              Judges Harsher
            </button>
            <button
              disabled={isLocked}
              onClick={() => setAlignment("ALIGNED")}
              className={`border-4 py-4 font-display font-black uppercase tracking-widest transition-all ${choiceClass(alignment === "ALIGNED", "gold")}`}
            >
              Aligned
            </button>
            <button
              disabled={isLocked}
              onClick={() => setAlignment("GENEROUS")}
              className={`border-4 py-4 font-display font-black uppercase tracking-widest transition-all ${choiceClass(alignment === "GENEROUS")}`}
            >
              Judges Generous
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-10">
        {isLocked ? (
          <div className="border-4 border-oracle-gold bg-[#080808] py-4 text-center font-display font-black uppercase tracking-widest text-oracle-gold shadow-[var(--shadow-brutal-sm)]">
            Predictions locked. Bhai, ab sirf wait karo.
          </div>
        ) : (
          <button
            disabled={isSubmitting}
            onClick={handleLock}
            className="brutal-button w-full py-5 font-display font-black uppercase tracking-widest disabled:opacity-50"
          >
            {isSubmitting ? "Locking..." : "Lock Predictions"}
          </button>
        )}
      </div>
    </div>
  );
}
