"use client";

import { useEffect, useRef } from "react";
import anime from "animejs/lib/anime.es.js";

export default function DivergenceSeismograph({ divergenceValue, history = [] }) {
  const pathRef = useRef(null);

  useEffect(() => {
    if (!pathRef.current) return;

    // SVG stroke drawing animation
    const animation = anime({
      targets: pathRef.current,
      strokeDashoffset: [anime.setDashoffset, 0],
      easing: 'easeInOutSine',
      duration: 1500,
      delay: 500,
      direction: 'alternate',
      loop: false
    });

    return () => {
      animation.pause();
    };
  }, []);

  // Generate a random jagged path if no history is provided to simulate the seismograph
  const points = history.length > 0 ? history : [0, 5, -5, 10, -10, 8, -2, 15, -15, 0];
  const stepX = 100 / (points.length - 1 || 1);
  const pathData = points.reduce((acc, val, i) => {
    const x = i * stepX;
    const y = 50 - (val * 3); // Scale value to fit SVG height 100
    return acc + (i === 0 ? `M ${x} ${y} ` : `L ${x} ${y} `);
  }, "");

  return (
    <div className="border border-brand-border bg-[#111111] p-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-md relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-latent-crimson to-transparent opacity-50" />
      <div className="flex justify-between items-end mb-4 relative z-10">
        <h3 className="text-xl font-display font-black uppercase tracking-widest text-white/80">Judge vs. Internet Divergence</h3>
        <span className="text-3xl font-mono font-black text-latent-crimson drop-shadow-[0_0_10px_rgba(139,30,45,0.4)]">{divergenceValue?.toFixed(2) || "0.00"}</span>
      </div>
      
      <div className="h-24 w-full bg-[#050505] relative overflow-hidden border border-brand-border rounded-sm z-10">
        <div className="absolute inset-0 grid grid-rows-3 opacity-10">
          <div className="border-b border-white"></div>
          <div className="border-b border-white"></div>
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible drop-shadow-[0_0_8px_rgba(139,30,45,0.6)]">
          <path
            ref={pathRef}
            d={pathData}
            fill="none"
            stroke="#8B1E2D"
            strokeWidth="3"
            strokeLinejoin="miter"
            strokeLinecap="square"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}
