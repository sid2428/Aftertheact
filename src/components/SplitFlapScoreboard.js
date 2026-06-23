"use client";

import { motion } from "framer-motion";

export default function SplitFlapScoreboard({ appearance, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-0 border border-brand-border divide-x divide-brand-border text-center bg-[#050505] animate-pulse h-24 rounded-md">
        <div className="p-3"></div><div className="p-3"></div><div className="p-3"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0 border border-brand-border divide-x divide-brand-border text-center bg-[#111111] rounded-md overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      <div className="p-3 sm:p-5">
        <div className="text-[10px] sm:text-xs font-display font-black uppercase tracking-widest text-white/40 mb-1">Peoples Verdict</div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100 }}
          className="text-2xl sm:text-4xl font-mono font-black text-white"
        >
          {appearance?.peoples_verdict_weighted?.toFixed(1) || "0.0"}
        </motion.div>
      </div>
      <div className="p-3 sm:p-5">
        <div className="text-[10px] sm:text-xs font-display font-black uppercase tracking-widest text-white/40 mb-1">Judge Avg</div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
          className="text-2xl sm:text-4xl font-mono font-black text-white"
        >
          {appearance?.judge_average?.toFixed(1) || "0.0"}
        </motion.div>
      </div>
      <div className="p-3 sm:p-5 bg-[#0A0A0A] text-white relative">
        <div className="absolute inset-0 bg-gradient-to-br from-latent-crimson/20 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="text-[10px] sm:text-xs font-display font-black uppercase tracking-widest text-latent-crimson mb-1">Latent Score</div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
            className="text-3xl sm:text-5xl font-mono font-black text-latent-crimson drop-shadow-[0_0_10px_rgba(139,30,45,0.4)]"
          >
            {appearance?.latent_score?.toFixed(1) || "0.0"}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
