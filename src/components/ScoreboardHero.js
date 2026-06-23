"use client";

import { motion } from "framer-motion";

export function ScoreboardHero() {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center relative overflow-hidden bg-[#0A0A0A]">
      
      {/* Background Gradients & Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-latent-gold/5 via-[#0A0A0A]/80 to-[#0A0A0A] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-latent-crimson/5 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center space-y-6 z-10 px-4"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-block bg-[#111111] text-white/70 border border-white/10 px-6 py-2 font-display font-black uppercase tracking-widest mb-4 shadow-[0_0_15px_rgba(255,255,255,0.05)] rounded-sm"
        >
          The Wall of Shame & Fame 🤡
        </motion.div>
        
        <h1 className="text-7xl sm:text-9xl md:text-[10rem] font-display font-black tracking-tighter uppercase text-white leading-[0.85] drop-shadow-2xl">
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
        
        <p className="text-xl sm:text-3xl text-white/70 max-w-3xl mx-auto font-medium mt-8 leading-snug">
          The only place where internet nobodies judge actual talent. Sorted worst to best, because we know you only care about who bombed. 💅🔥
        </p>
      </motion.div>

      {/* Scroll Down Indicator */}
      <motion.div 
        className="absolute bottom-12 flex flex-col items-center gap-2 z-20"
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

    </div>
  );
}
