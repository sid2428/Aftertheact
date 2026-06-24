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

      <div className="flex gap-6 overflow-x-auto pb-4 lg:grid lg:grid-cols-5 lg:overflow-visible">
        {members.map((m, i) => (
          <motion.div
            key={m.id || i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="group shrink-0 w-44 lg:w-auto"
          >
            <div className="relative pt-10 transition-transform duration-300 group-hover:-translate-y-2">
              {/* Cutout image overflowing upward */}
              <div className="relative z-10 h-44 flex items-end justify-center -mb-6">
                {m.image ? (
                  <img src={m.image} alt={m.name} className="h-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)] transition-all group-hover:brightness-110" />
                ) : (
                  <div className="w-28 h-40 bg-[#0A0A0A] rounded-md flex items-center justify-center font-display font-black text-4xl text-white/10">{m.name?.[0] || "?"}</div>
                )}
              </div>
              <div className="bg-[#111111] border border-white/10 rounded-md pt-10 pb-4 px-4 text-center transition-colors group-hover:border-latent-gold/50">
                <div className="font-display font-black uppercase tracking-tight text-white truncate">{m.name}</div>
                {m.descriptor && <div className="font-display font-bold uppercase tracking-widest text-[10px] text-latent-gold mt-0.5">{m.descriptor}</div>}
                {m.instagram_handle && (
                  <a
                    href={`https://instagram.com/${m.instagram_handle.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-block font-mono text-[10px] text-white/40 hover:text-latent-gold transition-colors mt-1"
                  >
                    {m.instagram_handle}
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
