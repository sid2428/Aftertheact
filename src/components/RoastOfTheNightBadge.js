"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function RoastOfTheNightBadge() {
  useEffect(() => {
    // Fire cinematic confetti on mount
    const end = Date.now() + 1000;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#8B1E2D', '#D4AF37', '#FFFFFF']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#8B1E2D', '#D4AF37', '#FFFFFF']
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
    <span className="text-[10px] font-display font-black uppercase tracking-widest text-white bg-latent-crimson px-2 py-1 shadow-[0_0_10px_rgba(139,30,45,0.6)] rounded-sm border border-latent-crimson/50">
      Roast of the night
    </span>
  );
}
