"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, animate } from "framer-motion";
import confetti from "canvas-confetti";

const AUTO_DISMISS_MS = 10000;

// Animates a number from 0 → target over `duration` seconds.
function useCountUp(target, duration = 0.8) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const controls = animate(0, target, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [target, duration]);
  return value;
}

export default function VerdictReveal({ userScore, crowdAverage, episodeId, onClose }) {
  const [remaining, setRemaining] = useState(AUTO_DISMISS_MS);
  const router = useRouter();

  const handleClose = () => {
    onClose();
    if (episodeId) router.push(`/episode/${episodeId}`);
  };

  const animatedUser = useCountUp(userScore, 0.8);
  const animatedCrowd = useCountUp(crowdAverage, 0.8);

  // Confetti burst + celebration sound — fire once when the modal opens.
  useEffect(() => {
    confetti({
      colors: ["#D4AF37", "#F5D97B", "#8B1E2D", "#ffffff"],
      origin: { x: 0.5, y: 0.6 },
      particleCount: 80,
      spread: 70,
      startVelocity: 30,
    });

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Ascending C major arpeggio: C5 → E5 → G5 → C6
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.13;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        osc.start(t);
        osc.stop(t + 0.55);
      });
    } catch (_) {
      // audio unavailable — silently skip
    }
  }, []);

  // Auto-dismiss after 10s, with a depleting countdown ring.
  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      const left = Math.max(0, AUTO_DISMISS_MS - (Date.now() - start));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(tick);
        handleClose();
      }
    }, 50);
    return () => clearInterval(tick);
  }, [onClose]);

  // Escape closes too.
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const divergence = Math.abs(userScore - crowdAverage);
  const ringProgress = (remaining / AUTO_DISMISS_MS) * 360;

  const modal = (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.8, opacity: 0, y: 60 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="w-full sm:max-w-[480px] bg-[#111111] border border-latent-gold/30 rounded-t-2xl sm:rounded-sm p-8 text-center shadow-[0_0_60px_rgba(0,0,0,0.8)]"
        >
          <div className="font-display font-black uppercase tracking-[0.25em] text-sm text-white/90">
            Your Verdict Is In
          </div>

          <div className="my-6 font-mono font-black text-latent-gold leading-none text-[80px] sm:text-[96px] drop-shadow-[0_0_25px_rgba(212,175,55,0.4)]">
            {animatedUser.toFixed(1)}
          </div>

          <div className="h-px w-full bg-white/10 my-6" />

          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">
              Crowd Average
            </span>
            <span className="font-mono font-black text-3xl text-latent-crimson drop-shadow-[0_0_12px_rgba(139,30,45,0.4)]">
              {animatedCrowd.toFixed(1)}
            </span>
          </div>

          {divergence > 2.0 && (
            <div className="mt-6 inline-block bg-latent-gold/15 border border-latent-gold/40 text-latent-gold font-display font-black uppercase tracking-widest text-xs px-4 py-2 rounded-sm">
              High Divergence 🔥 — You&apos;re an outlier
            </div>
          )}
          {divergence < 0.5 && (
            <div className="mt-6 inline-block bg-white/5 border border-white/15 text-white/70 font-display font-black uppercase tracking-widest text-xs px-4 py-2 rounded-sm">
              Aligned with the crowd ✓
            </div>
          )}

          {/* Close button with depleting countdown ring */}
          <div className="mt-8 flex justify-center">
            <div
              className="rounded-full p-[2px]"
              style={{
                background: `conic-gradient(rgba(212,175,55,0.7) ${ringProgress}deg, rgba(255,255,255,0.08) ${ringProgress}deg)`,
              }}
            >
              <button
                onClick={handleClose}
                className="rounded-full bg-[#111111] px-8 py-3 font-display font-black uppercase tracking-widest text-sm text-white/70 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
