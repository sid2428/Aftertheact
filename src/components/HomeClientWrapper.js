"use client";

import { motion } from "framer-motion";

export function HeroStagger({ children }) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3, // 300ms staggered reveals as requested
        delayChildren: 0.1
      }
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="w-full flex flex-col items-center relative z-10">
      {children}
    </motion.div>
  );
}

export function HeroItem({ children, className }) {
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };
  return <motion.div variants={item} className={className}>{children}</motion.div>;
}

export function FloatingScoreCard({ delay = 0, x = 0, y = 0, title, value, variant = 'default', children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: y + 20 }}
      animate={{ opacity: 1, y: [y, y - 15, y], x: [x, x + 10, x] }}
      transition={{ 
        opacity: { delay, duration: 1 },
        y: { repeat: Infinity, duration: 6, ease: "easeInOut", delay },
        x: { repeat: Infinity, duration: 8, ease: "easeInOut", delay }
      }}
      className={`absolute hidden md:block p-4 rounded-md border backdrop-blur-md shadow-2xl ${
        variant === 'crimson' ? 'bg-latent-crimson/10 border-latent-crimson/30' : 
        variant === 'gold' ? 'bg-latent-gold/5 border-latent-gold/20' : 
        'bg-[#111111]/80 border-white/10'
      }`}
      style={{ left: typeof x === 'string' ? x : undefined, top: typeof y === 'string' ? y : undefined }}
    >
      {children || (
        <>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/50 mb-1">{title}</div>
          <div className={`text-xl font-display font-black uppercase ${variant === 'crimson' ? 'text-latent-crimson' : variant === 'gold' ? 'text-latent-gold' : 'text-white'}`}>{value}</div>
        </>
      )}
    </motion.div>
  );
}
