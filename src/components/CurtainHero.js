"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

// Lightweight golden-particle field drifting up the stage.
function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let particles = [];
    let raf;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
      const count = Math.min(80, Math.max(40, Math.floor(width / 18)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 3 + Math.random() * 3,
        speed: 1 + Math.random() * 2,
        baseAlpha: 0.3 + Math.random() * 0.3,
        twinkle: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.y -= p.speed;
        p.twinkle += 0.03;
        if (p.y + p.r < 0) {
          p.y = height + p.r;
          p.x = Math.random() * width;
        }
        const alpha = p.baseAlpha + Math.sin(p.twinkle) * 0.15;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${Math.max(0, alpha)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    if (reduce) {
      // Draw a single static frame for reduced-motion users.
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${p.baseAlpha})`;
        ctx.fill();
      }
    } else {
      draw();
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

// Fixed side slots, kept clear of the center column (logo) and the bottom CTA band.
const SIDE_SLOTS = {
  left: { x: "12%", y: "46%", tilt: -5 },
  right: { x: "88%", y: "46%", tilt: 5 },
};

const CYCLE_MS = 3500;

// Cycles an index 0..length-1 on an interval; pauses if there's nothing to cycle through.
function useCycle(length) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (length <= 1) return;
    const id = setInterval(() => setI((v) => (v + 1) % length), CYCLE_MS);
    return () => clearInterval(id);
  }, [length]);
  return i;
}

function Face({ member, delay, slot }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, rotate: slot.tilt }}
      animate={{ opacity: 1, scale: 1.4, rotate: slot.tilt }}
      exit={{ opacity: 0, scale: 0.85 }}
      whileHover={{ rotate: 0, scale: 1.8 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: slot.x, top: slot.y }}
    >
      {/* Tooltip on hover */}
      <div className="pointer-events-none absolute top-3 left-1/2 z-30 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-sm border border-latent-gold/30 bg-[#111111] px-3 py-1.5 text-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="font-display font-black uppercase text-xs text-white tracking-widest">{member.name}</div>
        {member.descriptor && (
          <div className="font-mono text-[10px] uppercase tracking-widest text-latent-gold">{member.descriptor}</div>
        )}
      </div>

      <div className="relative w-32 h-44 md:w-44 md:h-60 lg:w-56 lg:h-80 transition-transform duration-300 group-hover:scale-105">
        {member.image ? (
          <Image
            src={member.image}
            alt={member.name || ""}
            fill
            sizes="224px"
            className="object-contain object-bottom drop-shadow-[0_0_14px_rgba(212,175,55,0.35)] group-hover:drop-shadow-[0_0_22px_rgba(212,175,55,0.6)] transition-[filter] duration-300"
            unoptimized
          />
        ) : (
          <span className="font-display font-black text-3xl text-white/20">{member.name?.[0] || "?"}</span>
        )}
      </div>
    </motion.div>
  );
}

export default function CurtainHero({ members = [] }) {
  const idx = useCycle(members.length);
  const half = Math.ceil(members.length / 2) || 1;
  const leftMember = members[idx];
  const rightMember = members[(idx + half) % members.length];

  return (
    <div
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 80%, rgba(139,30,45,0.15) 0%, transparent 60%), radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 50%), url('/bluecurtains-bg.png') center/cover",
      }}
    >
      <div className="spotlight-cone spot-a" style={{ left: "12%" }} />
      <div className="spotlight-cone spot-b" style={{ right: "12%" }} />

      {/* One judge face per side — absolutely positioned, independent of the logo, cycling through the roster */}
      <AnimatePresence mode="popLayout">
        {leftMember && <Face key={`l-${idx}`} member={leftMember} delay={idx === 0 ? 1.6 : 0} slot={SIDE_SLOTS.left} />}
        {rightMember && <Face key={`r-${idx}`} member={rightMember} delay={idx === 0 ? 1.75 : 0} slot={SIDE_SLOTS.right} />}
      </AnimatePresence>

      {/* Logo: centered on its own, unaffected by the scatter above */}
      <div className="relative z-10 flex items-center justify-center px-6">
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
      <div className="absolute bottom-0 left-0 w-full h-[15%] bg-gradient-to-t from-latent-gold/5 to-transparent pointer-events-none z-[5]" />

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
  );
}
