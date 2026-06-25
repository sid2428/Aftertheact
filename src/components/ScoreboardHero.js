"use client";

import { motion } from "framer-motion";

export function ScoreboardHero({ topThree = [] }) {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center relative overflow-hidden bg-[#0A0A0A]">

      {/* Background Gradients & Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-latent-gold/5 via-[#0A0A0A]/80 to-[#0A0A0A] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-latent-crimson/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl px-6 sm:px-12 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-0">

        {/* Left: the text — takes up exactly half */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 text-center lg:text-left space-y-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-surface inline-block text-white/70 px-6 py-2 font-display font-black uppercase tracking-widest rounded-full"
          >
            Every Score. Every Receipt.
          </motion.div>

          <h1 className="text-6xl sm:text-8xl md:text-[8.5rem] font-display font-black tracking-tighter uppercase text-white leading-[0.85] drop-shadow-2xl">
            THE PUBLIC<br/>
            <span className="text-latent-crimson relative inline-block drop-shadow-[0_0_15px_rgba(139,30,45,0.4)]">
              EXECUTION
              <motion.span
                className="absolute -bottom-2 sm:-bottom-4 left-0 w-full h-2 sm:h-4 bg-latent-crimson"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 0.8, ease: "circOut" }}
                style={{ originX: 0 }}
              />
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/70 max-w-lg font-medium leading-snug">
            The only place where internet nobodies judge actual talent. Sorted worst to best, because we know you only care about who bombed. 💅🔥
          </p>

          <motion.div
            className="flex flex-col items-center lg:items-start gap-2 pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <span className="text-xs font-display font-black uppercase tracking-widest text-white/30">Scroll to view</span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-latent-gold"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right: polaroids — mirrors the left side in width, centered within */}
        <div className="flex-1 flex items-center justify-center">
          {topThree.length > 0 ? (
            <div className="relative h-[26rem] w-[32rem]">
              {topThree.slice(0, 3).map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0, rotate: [-8, 5, -4][i] }}
                  whileHover={{ scale: 1.12, rotate: 0, zIndex: 20, transition: { duration: 0.3 } }}
                  transition={{ delay: 0.5 + i * 0.15, duration: 0.6, ease: "easeOut" }}
                  className="absolute top-4 origin-bottom cursor-pointer"
                  style={{ left: `${40 + i * 145}px`, zIndex: i === 1 ? 12 : 10 - i }}
                >
                  <div className="bg-white p-3 pb-8 shadow-[0_15px_50px_rgba(0,0,0,0.8)] border-4 border-white transition-shadow duration-300 hover:shadow-[0_20px_60px_rgba(212,175,55,0.4)]">
                    <div className="w-44 h-44 sm:w-48 sm:h-48 bg-[#111111] overflow-hidden flex items-center justify-center">
                      {c.image_url ? (
                        <img src={c.image_url} alt={c.name} className="object-cover w-full h-full" />
                      ) : (
                        <span className="font-display font-black text-5xl text-black/20">{c.name?.[0]}</span>
                      )}
                    </div>
                    <div className="mt-3 font-mono text-xs font-bold uppercase tracking-widest text-black/80 text-center truncate w-full">
                      {c.name}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* placeholder glow when no contestants yet */
            <div className="w-[32rem] h-[26rem] flex items-center justify-center">
              <div className="w-48 h-48 rounded-full bg-latent-gold/5 blur-[60px]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
