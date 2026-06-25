"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function LeaderboardHero({ topUsers = [] }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-latent-gold/5 via-[#0A0A0A]/80 to-[#0A0A0A] pointer-events-none" />

      {/* Red-carpet diagonal stripes */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(212,175,55,0.04) 0px, rgba(212,175,55,0.04) 2px, transparent 2px, transparent 24px)",
        }}
      />

      {/* Left: vertical stack of top-3 avatars */}
      {topUsers.length > 0 && (
        <div className="hidden lg:flex flex-col gap-4 absolute left-12 xl:left-24 top-1/2 -translate-y-1/2 z-10">
          {topUsers.slice(0, 3).map((u, i) => (
            <motion.div
              key={u.id || i}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.15, duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <span className="font-mono font-black text-2xl text-latent-gold/40 w-6 text-right">{i + 1}</span>
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-latent-gold/40 bg-[#111111] shadow-[0_0_20px_rgba(212,175,55,0.25)] flex items-center justify-center">
                {u.avatar_url ? (
                  <Image src={u.avatar_url} alt={u.username} fill sizes="56px" className="object-cover" />
                ) : (
                  <span className="font-display font-black text-xl text-white/20 uppercase">{u.username?.[0]}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Right: trophy */}
      <div className="hidden lg:block absolute right-8 xl:right-24 top-1/2 -translate-y-1/2 z-0 pointer-events-none opacity-80">
        <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_30px_rgba(212,175,55,0.4)]">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      </div>

      <div className="text-center space-y-6 z-10 relative">
        <div className="inline-block bg-[#111111] text-white/70 border border-white/10 px-6 py-2 font-display font-black uppercase tracking-widest mb-4 shadow-[0_0_15px_rgba(255,255,255,0.05)] rounded-sm">
          Prophet&apos;s Wall
        </div>

        <h1 className="text-7xl sm:text-9xl md:text-[8rem] font-display font-black tracking-tighter uppercase text-white leading-[0.85] drop-shadow-2xl">
          PROPHET&apos;S <span className="text-latent-gold relative inline-block drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
            WALL
            <span className="absolute -bottom-2 sm:-bottom-4 left-0 w-full h-2 sm:h-4 bg-latent-gold" />
          </span>
        </h1>

        <p className="text-xl sm:text-3xl text-white/70 max-w-3xl mx-auto font-medium mt-8 leading-snug">
          Season standing on one side. Oracle accuracy on the other.
        </p>
      </div>
    </div>
  );
}
