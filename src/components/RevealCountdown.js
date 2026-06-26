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

export default function RevealCountdown({ revealAt }) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(() => getRemaining(revealAt));
  const didRefreshRef = useRef(false);

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

  const parts = useMemo(() => {
    const hours = Math.floor(remaining / HOUR_MS);
    const minutes = Math.floor((remaining % HOUR_MS) / MINUTE_MS);
    return { hours, minutes };
  }, [remaining]);

  if (!revealAt) return null;

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3" aria-label="Reveal countdown">
      <div className="min-w-[82px] rounded-sm border border-latent-gold/50 bg-latent-gold/10 px-3 py-2 text-center shadow-[0_0_18px_rgba(212,175,55,0.18)]">
        <div suppressHydrationWarning className="font-number text-2xl font-black leading-none text-latent-gold sm:text-3xl">{pad(parts.hours)}</div>
        <div className="mt-1 font-display text-[9px] uppercase tracking-widest text-white/40">Hours</div>
      </div>
      <div className="min-w-[82px] rounded-sm border border-latent-gold/50 bg-latent-gold/10 px-3 py-2 text-center shadow-[0_0_18px_rgba(212,175,55,0.18)]">
        <div suppressHydrationWarning className="font-number text-2xl font-black leading-none text-latent-gold sm:text-3xl">{pad(parts.minutes)}</div>
        <div className="mt-1 font-display text-[9px] uppercase tracking-widest text-white/40">Min</div>
      </div>
    </div>
  );
}
