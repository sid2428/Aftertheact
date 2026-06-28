"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function JudgePanel({ members = [] }) {
  if (!members.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-12 mt-24">
      <div className="flex items-end justify-between border-b border-latent-gold/20 pb-3 mb-10">
        <h2 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-tighter text-white">The Panel</h2>
        <Link href="/panel" className="font-display font-black uppercase tracking-widest text-xs text-latent-gold hover:text-latent-gold-light transition-colors">
          Rate the Panel →
        </Link>
      </div>

      <div className="flex gap-6 sm:gap-8 overflow-x-auto pb-8 pt-4 px-4 -mx-4 no-scrollbar snap-x snap-mandatory">
        {members.map((m, i) => (
          <motion.div
            key={m.id || i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 200px 0px 200px" }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="group shrink-0 w-52 sm:w-64 snap-center perspective-1000"
          >
            <div className="relative transform-gpu transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:-translate-y-3">
              {/* Glow Behind Card */}
              <div className="absolute inset-0 bg-latent-gold/20 blur-xl rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              
              {/* Framed portrait */}
              <div className="relative z-10 aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A] shadow-[0_15px_35px_rgba(0,0,0,0.6)] transition-all duration-500 group-hover:border-latent-gold/50 group-hover:shadow-[0_20px_40px_rgba(212,175,55,0.2)]">
                {m.image ? (
                  <img src={m.image} alt={m.name} className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-110 group-hover:brightness-110" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display font-black text-6xl text-white/5">{m.name?.[0] || "?"}</div>
                )}
                {/* Vignette bottom gradient */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80" />
                
                {/* Text inside the card instead of below it for a sleeker look */}
                <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 transition-transform duration-500 group-hover:translate-y-0">
                  <div className="font-display font-black uppercase tracking-tighter text-2xl text-white truncate drop-shadow-md">{m.name}</div>
                  {m.instagram_handle && (
                    <a
                      href={`https://instagram.com/${m.instagram_handle.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-block font-mono text-[11px] text-latent-gold/70 hover:text-latent-gold transition-colors mt-1 opacity-0 group-hover:opacity-100 delay-100"
                    >
                      {m.instagram_handle}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
