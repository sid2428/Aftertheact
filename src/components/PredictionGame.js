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
    <div className="bg-white border-4 border-brand-black p-6 sm:p-10 shadow-[12px_12px_0px_0px_#0A0A0A]">
      <div className="mb-8 border-b-4 border-brand-black pb-4">
        <h2 className="text-3xl font-display font-black text-brand-black tracking-tight uppercase">The Oracle Board</h2>
        <p className="text-brand-black/70 font-medium mt-2">
          Lock in your predictions. Your Oracle Score is permanent. Choose wisely.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block text-sm font-display font-black uppercase tracking-widest text-brand-black mb-3">
            1. Who will top the episode?
          </label>
          <div className="relative">
            <select 
              disabled={isLocked}
              value={topId} 
              onChange={(e) => setTopId(e.target.value)}
              className="w-full bg-brand-gray appearance-none border-4 border-brand-black rounded-none p-4 text-brand-black font-display font-bold uppercase disabled:opacity-50 focus:outline-none focus:ring-0 focus:border-broadcast-red transition-colors"
            >
              <option value="" disabled>Select the Latent Legend...</option>
              {contestants.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-brand-black">
              ▼
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-display font-black uppercase tracking-widest text-brand-black mb-3">
            2. Who will bottom the episode?
          </label>
          <div className="relative">
            <select 
              disabled={isLocked}
              value={bottomId} 
              onChange={(e) => setBottomId(e.target.value)}
              className="w-full bg-brand-gray appearance-none border-4 border-brand-black rounded-none p-4 text-brand-black font-display font-bold uppercase disabled:opacity-50 focus:outline-none focus:ring-0 focus:border-broadcast-red transition-colors"
            >
              <option value="" disabled>Select the Rock Bottom...</option>
              {contestants.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-brand-black">
              ▼
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-display font-black uppercase tracking-widest text-brand-black mb-3">
            3. Will Judges & Audience Agree? (Divergence &lt; 1.5)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button 
              disabled={isLocked}
              onClick={() => setAlignment(true)}
              className={`py-4 font-display font-black uppercase tracking-widest border-4 transition-all shadow-[4px_4px_0px_0px_#0A0A0A] ${
                alignment === true 
                  ? "bg-broadcast-red text-white border-brand-black translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0px_0px_#0A0A0A]" 
                  : "bg-white text-brand-black border-brand-black hover:bg-brand-gray disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
              }`}
            >
              YES (Agree)
            </button>
            <button 
              disabled={isLocked}
              onClick={() => setAlignment(false)}
              className={`py-4 font-display font-black uppercase tracking-widest border-4 transition-all shadow-[4px_4px_0px_0px_#0A0A0A] ${
                alignment === false 
                  ? "bg-broadcast-red text-white border-brand-black translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0px_0px_#0A0A0A]" 
                  : "bg-white text-brand-black border-brand-black hover:bg-brand-gray disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
              }`}
            >
              NO (Diverge)
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10">
        {isLocked ? (
          <div className="text-center py-4 bg-brand-black text-white font-display font-black uppercase tracking-widest border-4 border-brand-black shadow-[4px_4px_0px_0px_#E53935]">
            Predictions Locked. Awaiting Revelation.
          </div>
        ) : (
          <button 
            disabled={isSubmitting}
            onClick={handleLock}
            className="w-full bg-brand-black text-white hover:bg-broadcast-red hover:text-white border-4 border-brand-black font-display font-black uppercase tracking-widest py-5 transition-colors shadow-[8px_8px_0px_0px_#0A0A0A] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#0A0A0A] disabled:opacity-50"
          >
            {isSubmitting ? "Locking..." : "Lock Predictions"}
          </button>
        )}
      </div>
    </div>
  );
}
