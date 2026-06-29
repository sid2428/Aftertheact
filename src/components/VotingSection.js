"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ResilientImg from "./ResilientImg";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import LiveVoting from "./LiveVoting";

function celebrate() {
  confetti({ colors: ["#D4AF37", "#F5D97B", "#8B1E2D", "#ffffff"], origin: { x: 0.5, y: 0.6 }, particleCount: 120, spread: 80, startVelocity: 35 });
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.start(t); osc.stop(t + 0.55);
    });
  } catch (_) {}
}

export default function VotingSection({ episodeId, contestants, isEpisodeClosed = false, revealAt = null }) {
  const cardRefs = useRef([]);
  const rowRefs = useRef([]);
  const [lockingAll, setLockingAll] = useState(false);
  const [allLocked, setAllLocked] = useState(false);
  const router = useRouter();

  const scrollToNext = (i) => {
    const next = rowRefs.current[i + 1];
    if (next) next.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const lockAll = async () => {
    setLockingAll(true);
    const ready = cardRefs.current.filter((c) => c?.canLock());
    const results = await Promise.all(ready.map((c) => c.lockIfReady(true))); // ponytail: silent=true suppresses per-card popups
    setLockingAll(false);
    if (results.some(Boolean)) {
      celebrate();
      setAllLocked(true);
    }
  };

  const handleAllLockedClose = () => {
    setAllLocked(false);
    router.push(`/episode/${episodeId}`);
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-end">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={lockAll}
          disabled={lockingAll}
          className="bg-gradient-to-r from-latent-gold to-[#B8860B] text-[#0A0A0A] font-display font-black uppercase tracking-widest px-8 py-3 rounded-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.5)] disabled:opacity-50 transition-all"
        >
          {lockingAll ? "Locking All..." : "Lock All Verdicts"}
        </motion.button>
      </div>

      <div className="space-y-16">
        {contestants.map((c, i) => {
          const flip = i % 2 === 1;
          return (
            <div key={c.id} ref={(el) => (rowRefs.current[i] = el)} className={`flex flex-col gap-8 items-stretch min-h-[520px] ${flip ? "md:flex-row-reverse" : "md:flex-row"}`}>
              <div className="w-full md:w-1/3 shrink-0">
                <div className="relative aspect-square w-full border border-brand-border bg-[#050505] rounded-md overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                  {c.image_url ? (
                    <ResilientImg src={c.image_url} alt={c.name} fallbackLetter={c.name[0]} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-display font-black text-8xl text-white/10">{c.name[0]}</div>
                  )}
                </div>
                <h3 className="mt-4 text-3xl font-display font-black uppercase tracking-tight text-white">{c.name}</h3>
                <div className="text-sm font-display font-bold text-latent-gold uppercase tracking-widest">{c.talent_type}</div>
              </div>
              <div className="flex-1 w-full">
                <LiveVoting
                  ref={(el) => (cardRefs.current[i] = el)}
                  episodeId={episodeId}
                  contestantId={c.id}
                  userVoteScore={c.userVoteScore}
                  isEpisodeClosed={isEpisodeClosed}
                  revealAt={revealAt}
                  onRevealClose={() => scrollToNext(i)}
                />
              </div>
            </div>
          );
        })}


      </div>

      {allLocked && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleAllLockedClose}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="w-full max-w-[400px] mx-4 bg-[#111111] border border-latent-gold/30 rounded-sm p-8 text-center shadow-[0_0_60px_rgba(0,0,0,0.8)]"
            >
              <div className="font-display font-black uppercase tracking-[0.25em] text-sm text-latent-gold mb-2">
                All Verdicts Locked
              </div>
              <div className="font-display text-xs uppercase tracking-widest text-white/40 mb-8">
                Head to the episode page for the big reveal
              </div>
              <button
                onClick={handleAllLockedClose}
                className="w-full rounded-sm border border-latent-gold/60 bg-latent-gold/15 text-latent-gold font-display font-black uppercase tracking-widest text-sm px-8 py-3 hover:bg-latent-gold/25 transition-colors"
              >
                View Reveal Countdown →
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
