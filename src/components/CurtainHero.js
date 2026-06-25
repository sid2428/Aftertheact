"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import * as Tooltip from "@radix-ui/react-tooltip";
import TypeOnce from "./TypeOnce";

function Face({ member, delay, tilt, idx = 0 }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: tilt }}
          animate={{ opacity: 1, scale: 1, rotate: tilt }}
          whileHover={{ rotate: 0, scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          tabIndex={0}
          className="group relative cursor-pointer rounded-md outline-none"
        >
          <div
            className="judge-float relative w-24 h-24 lg:w-32 lg:h-32 overflow-hidden rounded-md border-2 border-white/10 bg-[#111111] shadow-[0_8px_32px_rgba(0,0,0,0.6)] transition-colors duration-300 group-hover:border-latent-gold group-hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] flex items-center justify-center"
            style={{ "--float-dur": `${3.5 + (idx % 4) * 0.5}s`, "--float-delay": `${(idx % 5) * 0.4}s` }}
          >
            {member.image ? (
              <Image src={member.image} alt={member.name || ""} fill sizes="128px" className="object-cover" unoptimized />
            ) : (
              <span className="font-display text-3xl text-white/20">{member.name?.[0] || "?"}</span>
            )}
          </div>
        </motion.div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          sideOffset={8}
          className="z-[70] whitespace-nowrap rounded-sm border border-latent-gold/30 bg-[#111111] px-3 py-1.5 text-center shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
        >
          <div className="font-display uppercase text-xs text-white tracking-widest">{member.name}</div>
          {member.descriptor && (
            <div className="font-number text-[10px] uppercase tracking-widest text-latent-gold">{member.descriptor}</div>
          )}
          <Tooltip.Arrow className="fill-latent-gold/30" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export default function CurtainHero({ members = [] }) {
  const idx = useCycle(members.length);
  const half = Math.ceil(members.length / 2) || 1;
  const leftMember = members[idx];
  const rightMember = members[(idx + half) % members.length];

  return (
    <Tooltip.Provider delayDuration={150}>
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#05060a]">
      {/* Blue curtain backdrop — the stage behind the velvet drapes */}
      <img src="/bluecurtains-bg.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      {/* Soft vignette so the logo + faces read against the curtain */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,_transparent_0%,_rgba(5,6,10,0.55)_75%)] pointer-events-none" />

      {/* Stage: faces flank the logo (desktop) */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-8 px-6">
        <div className="flex items-center justify-center gap-6 lg:gap-16">
          <div className="hidden md:flex items-center gap-6 lg:gap-10">
            {left.map((m, i) => (
              <Face key={`l${i}`} member={m} delay={1.6 + i * 0.15} tilt={i % 2 === 0 ? -3 : 3} idx={i} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative shrink-0"
          >
            {/* pulsing logo halo */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-latent-gold/20 blur-[80px] rounded-full"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            />
            <motion.img
              src="/logo.png"
              alt="After The Act"
              className="relative w-[53vw] max-w-none h-auto drop-shadow-[0_0_40px_rgba(212,175,55,0.5)]"
              animate={{ scale: [1, 1.25, 1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, times: [0, 0.15, 0.3, 0.45, 1] }}
            />
          </motion.div>

          <div className="hidden md:flex items-center gap-6 lg:gap-10">
            {right.map((m, i) => (
              <Face key={`r${i}`} member={m} delay={1.6 + i * 0.15} tilt={i % 2 === 0 ? 3 : -3} idx={i + half} />
            ))}
          </div>
        </div>

        {/* Typed tagline (desktop only to avoid overlapping the CTAs on small screens) */}
        <TypeOnce
          text="The show ends. The receipts begin."
          sessionKey="hero-tagline-seen"
          delay={2100}
          className="hidden sm:block text-center font-display text-xl lg:text-2xl uppercase tracking-[0.25em] text-white/80"
        />

        {/* Mobile judge strip — all judges in a scrollable row */}
        {members.length > 0 && (
          <div className="md:hidden flex gap-4 overflow-x-auto p-2 max-w-full no-scrollbar">
            {members.map((m, i) => (
              <div key={`m${i}`} className="flex shrink-0 flex-col items-center gap-1">
                <div className="relative w-16 h-16 overflow-hidden rounded-md border border-white/10 bg-[#111111] shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center justify-center">
                  {m.image ? (
                    <Image src={m.image} alt={m.name || ""} fill sizes="64px" className="object-cover" unoptimized />
                  ) : (
                    <span className="font-display font-black text-xl text-white/20">{m.name?.[0] || "?"}</span>
                  )}
                </div>
                {m.name && (
                  <span className="font-display font-black uppercase text-[10px] text-white/70 tracking-widest max-w-[64px] truncate text-center">{m.name}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTAs revealed after the curtains open */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.9, duration: 0.6 }}
        className="absolute bottom-24 z-10 flex flex-col sm:flex-row justify-center gap-6 px-6 w-full max-w-4xl"
      >
        <Link href="/api/auth/signin" className="relative group overflow-hidden flex-1 text-center bg-latent-gold text-[#0A0A0A] font-display font-black uppercase tracking-[0.25em] px-8 sm:px-10 py-5 sm:py-6 text-lg sm:text-xl shadow-[0_0_30px_rgba(212,175,55,0.2)] hover:shadow-[0_0_50px_rgba(212,175,55,0.6)] hover:-translate-y-1 transition-all duration-500 rounded-none border border-transparent">
          <span className="relative z-10 group-hover:text-black transition-colors duration-500">Join the Jury</span>
          <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
        </Link>
        <Link href="/scoreboard" className="relative group overflow-hidden flex-1 text-center bg-[#050505]/60 backdrop-blur-xl text-white font-display font-black uppercase tracking-[0.25em] px-8 sm:px-10 py-5 sm:py-6 text-lg sm:text-xl border border-white/20 hover:border-latent-gold hover:text-latent-gold shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_50px_rgba(212,175,55,0.3)] hover:-translate-y-1 transition-all duration-500 rounded-none">
          <span className="relative z-10">Explore Scoreboard</span>
          <div className="absolute inset-0 bg-latent-gold/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
        </Link>
      </motion.div>

      {/* Reflective stage floor */}
      <div className="absolute bottom-0 left-0 w-full h-[18%] bg-gradient-to-t from-[#05060a] to-transparent pointer-events-none z-[5]" />

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 1 }}
      >
        <span className="text-[10px] font-display font-black uppercase tracking-widest text-white/30">Scroll</span>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-latent-gold"><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>
        </motion.div>
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
    </Tooltip.Provider>
  );
}
