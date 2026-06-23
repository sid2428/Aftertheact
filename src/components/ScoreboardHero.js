"use client";

import { motion } from "framer-motion";

export function ScoreboardHero() {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center relative border-b-8 border-brand-black bg-brand-white">
      
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
          className="inline-block bg-brand-black text-white px-6 py-2 font-display font-black uppercase tracking-widest mb-4 shadow-[4px_4px_0px_0px_#E53935]"
        >
          The Wall of Shame & Fame 🤡
        </motion.div>
        
        <h1 className="text-7xl sm:text-9xl md:text-[10rem] font-display font-black tracking-tighter uppercase text-brand-black leading-[0.85] drop-shadow-xl">
          THE PUBLIC<br/>
          <span className="text-broadcast-red relative inline-block">
            EXECUTION
            <motion.span 
              className="absolute -bottom-2 sm:-bottom-4 left-0 w-full h-2 sm:h-4 bg-brand-black"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.6, duration: 0.8, ease: "circOut" }}
              style={{ originX: 0 }}
            />
          </span>
        </h1>
        
        <p className="text-xl sm:text-3xl text-brand-black/70 max-w-3xl mx-auto font-medium mt-8 leading-snug">
          The only place where internet nobodies judge actual talent. Sorted worst to best, because we know you only care about who bombed. 💅🔥
        </p>
      </motion.div>

      {/* Scroll Down Indicator */}
      <motion.div 
        className="absolute bottom-12 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <span className="text-xs font-display font-black uppercase tracking-widest text-brand-black/50">Scroll to view</span>
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-broadcast-red"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
        </motion.div>
      </motion.div>

    </div>
  );
}
