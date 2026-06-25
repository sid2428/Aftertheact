"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import RollingNumber from "./RollingNumber";

const AUTO_DISMISS_MS = 10000;

export default function VerdictReveal({ userScore, onClose }) {
  const [remaining, setRemaining] = useState(AUTO_DISMISS_MS);
  const router = useRouter();

  const handleClose = () => {
    onClose();
    if (episodeId) router.push(`/episode/${episodeId}`);
  };

  useEffect(() => {
    import("canvas-confetti").then(({ default: confetti }) => {
      confetti({
        colors: ["#D4AF37", "#F5D97B", "#8B1E2D", "#ffffff"],
        origin: { x: 0.5, y: 0.6 },
        particleCount: 80,
        spread: 70,
        startVelocity: 30,
      });
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

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const ringProgress = (remaining / AUTO_DISMISS_MS) * 360;

  const modal = (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/85 p-0 backdrop-blur-md sm:items-center sm:p-6"
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
          className="glass-panel w-full rounded-t-2xl border-latent-gold/30 p-8 text-center shadow-[0_0_60px_rgba(0,0,0,0.8)] sm:max-w-[480px] sm:rounded-2xl"
        >
          <div className="font-display text-sm font-black uppercase tracking-[0.25em] text-white/90">
            Your Verdict Is In
          </div>

          <div className="my-6 flex justify-center drop-shadow-[0_0_25px_rgba(212,175,55,0.4)]">
            <RollingNumber value={userScore} decimals={1} height={92} className="font-bold text-latent-gold" />
          </div>

          <div className="mt-8 flex justify-center">
            <div
              className="rounded-full p-[2px]"
              style={{
                background: `conic-gradient(rgba(212,175,55,0.7) ${ringProgress}deg, rgba(255,255,255,0.08) ${ringProgress}deg)`,
              }}
            >
              <button
                onClick={onClose}
                className="rounded-full bg-[#111111] px-8 py-3 font-display text-sm font-black uppercase tracking-widest text-white/70 transition-colors hover:text-white"
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
