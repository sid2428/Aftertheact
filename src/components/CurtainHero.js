"use client";

import { motion } from "framer-motion";
import Link from "next/link";

function Face({ member, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative">
        {/* halo */}
        <div className="absolute -inset-2 rounded-full bg-latent-gold/30 blur-xl" />
        <div className="relative w-20 h-20 lg:w-28 lg:h-28 rounded-full overflow-hidden border-2 border-latent-gold/60 bg-[#111111] shadow-[0_0_25px_rgba(212,175,55,0.4)] flex items-center justify-center">
          {member.image ? (
            <img src={member.image} alt={member.name || ""} className="object-cover w-full h-full" />
          ) : (
            <span className="font-display font-black text-3xl text-white/20">{member.name?.[0] || "?"}</span>
          )}
        </div>
      </div>
      {member.name && (
        <span className="font-display font-black uppercase text-xs lg:text-sm text-white/80 tracking-widest text-center max-w-[120px] truncate">{member.name}</span>
      )}
    </motion.div>
  );
}

export default function CurtainHero({ members = [] }) {
  const half = Math.ceil(members.length / 2);
  const left = members.slice(0, half);
  const right = members.slice(half);

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Blue curtain backdrop */}
      <img src="/bluecurtains-bg.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/30 via-transparent to-[#0A0A0A]" />

      {/* Stage: faces flank the logo */}
      <div className="relative z-10 flex items-center justify-center gap-6 lg:gap-16 px-6">
        <div className="hidden md:flex items-center gap-6 lg:gap-10">
          {left.map((m, i) => <Face key={`l${i}`} member={m} delay={1.6 + i * 0.15} />)}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative shrink-0"
        >
          {/* logo halo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-latent-gold/20 blur-[80px] rounded-full" />
          <img src="/logo.png" alt="After The Act" className="relative w-[53vw] max-w-none h-auto drop-shadow-[0_0_40px_rgba(212,175,55,0.5)]" />
        </motion.div>

        <div className="hidden md:flex items-center gap-6 lg:gap-10">
          {right.map((m, i) => <Face key={`r${i}`} member={m} delay={1.6 + i * 0.15} />)}
        </div>
      </div>

      {/* CTAs revealed after the curtains open */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.9, duration: 0.6 }}
        className="absolute bottom-16 z-10 flex flex-col sm:flex-row justify-center gap-4 px-6"
      >
        <Link href="/api/auth/signin" className="bg-gradient-to-r from-latent-gold to-[#B8860B] text-[#0A0A0A] font-display font-black uppercase tracking-widest px-8 py-4 hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all rounded-sm">
          Join the Jury
        </Link>
        <Link href="/scoreboard" className="glass-panel text-white font-display font-black uppercase tracking-widest px-8 py-4 hover:bg-white/10 transition-colors rounded-sm">
          Explore Scoreboard
        </Link>
      </motion.div>

      {/* Red velvet curtains — flick and bounce open from the middle */}
      <motion.img
        src="/curtains-left.png"
        alt=""
        initial={{ x: "0%" }}
        animate={{ x: "-101%" }}
        transition={{ delay: 0.3, duration: 1.7, ease: "anticipate" }}
        className="absolute top-0 left-0 h-full w-[52%] object-cover z-20 pointer-events-none"
      />
      <motion.img
        src="/curtains-right.png"
        alt=""
        initial={{ x: "0%" }}
        animate={{ x: "101%" }}
        transition={{ delay: 0.3, duration: 1.7, ease: "anticipate" }}
        className="absolute top-0 right-0 h-full w-[52%] object-cover z-20 pointer-events-none"
      />
    </div>
  );
}
