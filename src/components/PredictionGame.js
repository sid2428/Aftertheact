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

  return (
    <div className="bg-[#111111] border border-brand-border p-6 sm:p-10 shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-md relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-latent-gold to-transparent opacity-50" />
      <div className="mb-8 border-b border-brand-border pb-4 relative z-10">
        <h2 className="text-3xl font-display font-black text-white tracking-tight uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">The Oracle Board</h2>
        <p className="text-white/60 font-medium mt-2">
          Lock in your predictions. Your Oracle Score is permanent. Choose wisely.
        </p>
      </div>

      <div className="space-y-8 relative z-10">
        <div>
          <label className="block text-sm font-display font-black uppercase tracking-widest text-latent-gold mb-3 drop-shadow-[0_0_5px_rgba(212,175,55,0.3)]">
            1. Who will top the episode?
          </label>
          <div className="relative">
            <select 
              disabled={isLocked}
              value={topId} 
              onChange={(e) => setTopId(e.target.value)}
              className="w-full bg-[#050505] appearance-none border border-brand-border rounded-sm p-4 text-white font-display font-bold uppercase disabled:opacity-50 focus:outline-none focus:ring-0 focus:border-latent-gold transition-colors shadow-inner"
            >
              <option value="" disabled>Select the Latent Legend...</option>
              {contestants.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/50">
              ▼
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-display font-black uppercase tracking-widest text-white/70 mb-3">
            2. Who will bottom the episode?
          </label>
          <div className="relative">
            <select 
              disabled={isLocked}
              value={bottomId} 
              onChange={(e) => setBottomId(e.target.value)}
              className="w-full bg-[#050505] appearance-none border border-brand-border rounded-sm p-4 text-white font-display font-bold uppercase disabled:opacity-50 focus:outline-none focus:ring-0 focus:border-latent-gold transition-colors shadow-inner"
            >
              <option value="" disabled>Select the Rock Bottom...</option>
              {contestants.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/50">
              ▼
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-display font-black uppercase tracking-widest text-white/70 mb-3">
            3. Will Judges & Audience Agree? (Divergence &lt; {ORACLE_SCORING.ALIGNMENT_MARGIN})
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button 
              disabled={isLocked}
              onClick={() => setAlignment("HARSH")}
              className={`py-4 font-display font-black uppercase tracking-widest border transition-all rounded-sm ${
                alignment === "HARSH" 
                  ? "bg-latent-crimson/20 text-latent-crimson border-latent-crimson shadow-[0_0_15px_rgba(139,30,45,0.3)]" 
                  : "bg-[#050505] text-white/50 border-brand-border hover:bg-white/10 hover:text-white disabled:opacity-50"
              }`}
            >
              Judges Harsher
            </button>
            <button 
              disabled={isLocked}
              onClick={() => setAlignment("ALIGNED")}
              className={`py-4 font-display font-black uppercase tracking-widest border transition-all rounded-sm ${
                alignment === "ALIGNED" 
                  ? "bg-latent-gold/20 text-latent-gold border-latent-gold shadow-[0_0_15px_rgba(212,175,55,0.3)]" 
                  : "bg-[#050505] text-white/50 border-brand-border hover:bg-white/10 hover:text-white disabled:opacity-50"
              }`}
            >
              Aligned
            </button>
            <button 
              disabled={isLocked}
              onClick={() => setAlignment("GENEROUS")}
              className={`py-4 font-display font-black uppercase tracking-widest border transition-all rounded-sm ${
                alignment === "GENEROUS" 
                  ? "bg-blue-500/20 text-blue-500 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                  : "bg-[#050505] text-white/50 border-brand-border hover:bg-white/10 hover:text-white disabled:opacity-50"
              }`}
            >
              Judges Generous
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10 relative z-10">
        {isLocked ? (
          <div className="text-center py-4 bg-[#050505] text-latent-gold font-display font-black uppercase tracking-widest border border-latent-gold/30 rounded-sm shadow-[0_0_20px_rgba(212,175,55,0.1)]">
            Predictions Locked. Awaiting Revelation.
          </div>
        ) : (
          <button 
            disabled={isSubmitting}
            onClick={handleLock}
            className="w-full bg-white text-[#0A0A0A] hover:bg-latent-gold hover:text-[#0A0A0A] border border-transparent font-display font-black uppercase tracking-widest py-5 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-50 rounded-sm"
          >
            {isSubmitting ? "Locking..." : "Lock Predictions"}
          </button>
        )}
      </div>
    </div>
  );
}
