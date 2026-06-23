"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function RoastOfTheNightBadge() {
  useEffect(() => {
    // Fire brutalist-colored confetti on mount
    const end = Date.now() + 1000;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#E53935', '#0A0A0A', '#FFFFFF']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#E53935', '#0A0A0A', '#FFFFFF']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    // Only fire if user doesn't prefer reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      frame();
    }
  }, []);

  return (
    <span className="text-[10px] font-display font-black uppercase tracking-widest text-white bg-broadcast-red px-2 py-1 shadow-[2px_2px_0px_0px_rgba(10,10,10,1)]">
      Roast of the night
    </span>
  );
}
