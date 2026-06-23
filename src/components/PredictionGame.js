"use client";

import { useState } from "react";
import { submitPredictions } from "@/app/actions/predictions";

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

  return (
    <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 p-6 rounded-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-rose-500 tracking-tight">The Oracle Board</h2>
        <p className="text-neutral-400 text-sm mt-1">
          Lock in your predictions. Your Oracle Score is permanent. Choose wisely.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold uppercase tracking-widest text-neutral-500 mb-2">
            1. Who will top the episode?
          </label>
          <select 
            disabled={isLocked}
            value={topId} 
            onChange={(e) => setTopId(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white disabled:opacity-50"
          >
            <option value="" disabled>Select the Latent Legend...</option>
            {contestants.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold uppercase tracking-widest text-neutral-500 mb-2">
            2. Who will bottom the episode?
          </label>
          <select 
            disabled={isLocked}
            value={bottomId} 
            onChange={(e) => setBottomId(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white disabled:opacity-50"
          >
            <option value="" disabled>Select the Rock Bottom...</option>
            {contestants.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold uppercase tracking-widest text-neutral-500 mb-2">
            3. Will Judges & Audience Agree? (Divergence &lt; 1.5)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button 
              disabled={isLocked}
              onClick={() => setAlignment(true)}
              className={`py-3 font-bold rounded-lg border transition-colors ${
                alignment === true 
                  ? "bg-rose-500 text-white border-rose-500" 
                  : "bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-500 disabled:opacity-50"
              }`}
            >
              YES (Agree)
            </button>
            <button 
              disabled={isLocked}
              onClick={() => setAlignment(false)}
              className={`py-3 font-bold rounded-lg border transition-colors ${
                alignment === false 
                  ? "bg-rose-500 text-white border-rose-500" 
                  : "bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-500 disabled:opacity-50"
              }`}
            >
              NO (Diverge)
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-neutral-800">
        {isLocked ? (
          <div className="text-center py-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold rounded-lg">
            Predictions Locked. Awaiting Revelation.
          </div>
        ) : (
          <button 
            disabled={isSubmitting}
            onClick={handleLock}
            className="w-full bg-white text-black hover:bg-neutral-200 font-black uppercase tracking-widest py-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Locking..." : "Lock Predictions"}
          </button>
        )}
      </div>
    </div>
  );
}
