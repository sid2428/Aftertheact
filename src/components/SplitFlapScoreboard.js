"use client";

import { motion } from "framer-motion";
import RollingNumber from "./RollingNumber";

export default function SplitFlapScoreboard({ appearance, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="glass-surface grid grid-cols-3 gap-0 divide-x divide-white/10 text-center animate-pulse h-24 rounded-2xl overflow-hidden">
        <div className="p-3"></div><div className="p-3"></div><div className="p-3"></div>
      </div>
    );
  }

  return (
    <div className="glass-surface grid grid-cols-3 gap-0 divide-x divide-white/10 text-center rounded-2xl overflow-hidden">
      <div className="p-3 sm:p-5">
        <div className="text-[10px] sm:text-xs font-display font-black uppercase tracking-widest text-white/40 mb-1">Self Score</div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100, delay: 0.15 }}>
          <RollingNumber value={appearance?.self_score || 0} decimals={1} height={34} suspense className="justify-center font-bold text-white/70" />
        </motion.div>
      </div>
      <div className="p-3 sm:p-5">
        <div className="text-[10px] sm:text-xs font-display font-black uppercase tracking-widest text-white/40 mb-1">Panel Score</div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100, delay: 0.2 }}>
          <RollingNumber value={appearance?.judge_average || 0} decimals={1} height={34} suspense className="justify-center font-bold text-white" />
        </motion.div>
      </div>
      <div className="p-3 sm:p-5 bg-white/[0.03] text-white relative">
        <div className="absolute inset-0 bg-gradient-to-br from-latent-crimson/20 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="text-[10px] sm:text-xs font-display font-black uppercase tracking-widest text-latent-crimson mb-1">Crowd Score</div>
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.5 }}>
            <RollingNumber value={appearance?.latent_score || 0} decimals={1} height={42} suspense headline className="justify-center font-bold text-latent-crimson drop-shadow-[0_0_10px_rgba(139,30,45,0.4)]" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
