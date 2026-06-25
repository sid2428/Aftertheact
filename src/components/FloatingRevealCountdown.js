"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

function getRemaining(target) {
  return Math.max(0, new Date(target).getTime() - Date.now());
}

function pad(value) {
  return String(value).padStart(2, "0");
}

export default function FloatingRevealCountdown({ revealAt }) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(() => getRemaining(revealAt));
  const didRefreshRef = useRef(false);

  const [animatingRemaining, setAnimatingRemaining] = useState(60 * HOUR_MS);
  const [isAnimating, setIsAnimating] = useState(true);

  // Interval for actual time ticking
  useEffect(() => {
    didRefreshRef.current = false;
    const interval = window.setInterval(() => {
      const next = getRemaining(revealAt);
      setRemaining(next);
      if (next === 0 && !didRefreshRef.current) {
        didRefreshRef.current = true;
        router.refresh();
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [revealAt, router]);

  // Animation on mount
  useEffect(() => {
    let start;
    let animationFrame;
    const duration = 5000;
    const initialValue = 60 * HOUR_MS;
    
    const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const tick = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const t = Math.min(elapsed / duration, 1);
      
      const targetValue = getRemaining(revealAt);
      const easedT = easeOutExpo(t);
      const currentValue = initialValue - (initialValue - targetValue) * easedT;
      
      setAnimatingRemaining(currentValue);
      
      if (t < 1) {
        animationFrame = requestAnimationFrame(tick);
      } else {
        setIsAnimating(false);
      }
    };
    
    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [revealAt]);

  const displayTime = isAnimating ? animatingRemaining : remaining;
  const parts = useMemo(() => {
    const hours = Math.floor(displayTime / HOUR_MS);
    const minutes = Math.floor((displayTime % HOUR_MS) / MINUTE_MS);
    return { hours, minutes };
  }, [displayTime]);

  if (!revealAt) return null;

  return (
    <>
      {/* Inline for small screens (hidden on xl+) */}
      <div className="xl:hidden flex items-center justify-center gap-8 mb-6 p-6 rounded-2xl bg-black/40 border border-white/5 shadow-inner">
        <div className="flex flex-col items-center">
          <div className="font-number text-5xl font-black text-latent-gold drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
            {pad(parts.hours)}
          </div>
          <div className="mt-1 font-display text-sm uppercase tracking-widest text-latent-gold/60">
            Hours
          </div>
        </div>
        
        <div className="font-number text-5xl font-black text-white/20 animate-pulse">
          :
        </div>

        <div className="flex flex-col items-center">
          <div className="font-number text-5xl font-black text-latent-gold drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
            {pad(parts.minutes)}
          </div>
          <div className="mt-1 font-display text-sm uppercase tracking-widest text-latent-gold/60">
            Min
          </div>
        </div>
      </div>

      {/* Left side: Hours (Floating on xl+) */}
      <div className="hidden xl:flex absolute top-1/2 -translate-y-1/2 right-full mr-6 2xl:mr-12 flex-col items-center justify-center opacity-40 select-none pointer-events-none mix-blend-screen">
        <div className="font-number text-[7rem] 2xl:text-[8rem] font-black leading-none text-latent-gold drop-shadow-[0_0_40px_rgba(212,175,55,0.4)]">
          {pad(parts.hours)}
        </div>
        <div className="mt-4 font-display text-xl 2xl:text-2xl uppercase tracking-widest text-latent-gold/60">
          Hours
        </div>
      </div>

      {/* Right side: Minutes (Floating on xl+) */}
      <div className="hidden xl:flex absolute top-1/2 -translate-y-1/2 left-full ml-6 2xl:ml-12 flex-col items-center justify-center opacity-40 select-none pointer-events-none mix-blend-screen">
        <div className="font-number text-[7rem] 2xl:text-[8rem] font-black leading-none text-latent-gold drop-shadow-[0_0_40px_rgba(212,175,55,0.4)]">
          {pad(parts.minutes)}
        </div>
        <div className="mt-4 font-display text-xl 2xl:text-2xl uppercase tracking-widest text-latent-gold/60">
          Min
        </div>
      </div>
    </>
  );
}
