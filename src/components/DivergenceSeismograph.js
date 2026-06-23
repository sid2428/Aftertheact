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
    <div className="border-4 border-brand-black bg-white p-4 shadow-[8px_8px_0px_0px_#0A0A0A]">
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-xl font-display font-black uppercase tracking-widest text-brand-black">Judge vs. Internet Divergence</h3>
        <span className="text-3xl font-mono font-black text-broadcast-red">{divergenceValue?.toFixed(2) || "0.00"}</span>
      </div>
      
      <div className="h-24 w-full bg-brand-gray relative overflow-hidden border-2 border-brand-black/20">
        <div className="absolute inset-0 grid grid-rows-3 opacity-10">
          <div className="border-b-2 border-brand-black"></div>
          <div className="border-b-2 border-brand-black"></div>
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <path
            ref={pathRef}
            d={pathData}
            fill="none"
            stroke="#E53935"
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
