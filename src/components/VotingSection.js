"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import LiveVoting from "./LiveVoting";

export default function VotingSection({ episodeId, contestants }) {
  const cardRefs = useRef([]);
  const [lockingAll, setLockingAll] = useState(false);

  const lockAll = async () => {
    setLockingAll(true);
    const ready = cardRefs.current.filter((c) => c?.canLock());
    await Promise.all(ready.map((c) => c.lockIfReady()));
    setLockingAll(false);
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
          {lockingAll ? "Locking All..." : "Lock All Votes"}
        </motion.button>
      </div>

      <div className="space-y-16">
        {contestants.map((c, i) => {
          const flip = i % 2 === 1; // alternate image side
          return (
            <div key={c.id} className={`flex flex-col gap-8 items-stretch min-h-[520px] ${flip ? "md:flex-row-reverse" : "md:flex-row"}`}>
              {/* Photo — ~1/3 of the row */}
              <div className="w-full md:w-1/3 shrink-0">
                <div className="relative aspect-square w-full border border-brand-border bg-[#050505] rounded-md overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-display font-black text-8xl text-white/10">{c.name[0]}</div>
                  )}
                </div>
                <h3 className="mt-4 text-3xl font-display font-black uppercase tracking-tight text-white">{c.name}</h3>
                <div className="text-sm font-display font-bold text-latent-gold uppercase tracking-widest">{c.talent_type}</div>
              </div>
              {/* Voting — opposite side, fills remaining space */}
              <div className="flex-1 w-full">
                <LiveVoting
                  ref={(el) => (cardRefs.current[i] = el)}
                  episodeId={episodeId}
                  contestantId={c.id}
                  initialRawScore={c.initialRawScore}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
