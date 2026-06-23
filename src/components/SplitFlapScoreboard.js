"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

// Lazy load the heavy 3D component so it doesn't block the main bundle
const SplitFlap3D = dynamic(() => import("./SplitFlap3D"), {
  ssr: false,
  loading: () => <ScoreboardFallback isLoading={true} />
});

export default function SplitFlapScoreboard({ appearance }) {
  const [shouldRender3D, setShouldRender3D] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference or low-end device heuristic (hardware concurrency)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    
    if (!prefersReducedMotion && !isLowEnd) {
      setShouldRender3D(true);
    }
  }, []);

  if (shouldRender3D) {
    return <SplitFlap3D appearance={appearance} />;
  }

  // Fallback 2D version
  return <ScoreboardFallback appearance={appearance} />;
}

function ScoreboardFallback({ appearance, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-0 border-4 border-brand-black divide-x-4 divide-brand-black text-center bg-brand-gray animate-pulse h-24">
        <div className="p-3"></div><div className="p-3"></div><div className="p-3"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0 border-4 border-brand-black divide-x-4 divide-brand-black text-center bg-white">
      <div className="p-3">
        <div className="text-[10px] sm:text-xs font-display font-black uppercase tracking-widest text-brand-black/50 mb-1">Peoples Verdict</div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100 }}
          className="text-2xl sm:text-3xl font-mono font-black"
        >
          {appearance.peoples_verdict_weighted?.toFixed(1) || "0.0"}
        </motion.div>
      </div>
      <div className="p-3">
        <div className="text-[10px] sm:text-xs font-display font-black uppercase tracking-widest text-brand-black/50 mb-1">Judge Avg</div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
          className="text-2xl sm:text-3xl font-mono font-black"
        >
          {appearance.judge_average?.toFixed(1) || "0.0"}
        </motion.div>
      </div>
      <div className="p-3 bg-brand-black text-white">
        <div className="text-[10px] sm:text-xs font-display font-black uppercase tracking-widest text-broadcast-red mb-1">Latent Score</div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
          className="text-3xl sm:text-4xl font-mono font-black text-broadcast-red"
        >
          {appearance.latent_score?.toFixed(1) || "0.0"}
        </motion.div>
      </div>
    </div>
  );
}
