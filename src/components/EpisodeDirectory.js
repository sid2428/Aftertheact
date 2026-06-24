"use client";

import { useState } from "react";
import Link from "next/link";

export default function EpisodeDirectory({ episodes = [] }) {
  const [descending, setDescending] = useState(true); // latest first by default

  const sorted = [...episodes].sort((a, b) => {
    const diff = (a.episode_number || 0) - (b.episode_number || 0);
    return descending ? -diff : diff;
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-white/10 pb-4">
        <h2 className="text-2xl font-display font-black uppercase tracking-widest text-white">Episode Directory</h2>
        <button
          onClick={() => setDescending((d) => !d)}
          className="flex items-center gap-2 text-xs font-display font-black uppercase tracking-widest text-white/50 hover:text-latent-gold transition-colors"
        >
          Episode {descending ? "↓ Newest" : "↑ Oldest"}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sorted.map((ep) => (
          <Link key={ep.id} href={`/episode/${ep.id}`} className="group block bg-[#111111] border border-white/10 hover:border-latent-gold/50 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] transition-all relative overflow-hidden rounded-md">
            <div className="p-6 relative z-10 flex flex-col h-full justify-between min-h-[200px]">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="font-display font-black text-5xl text-white/5 group-hover:text-white/10 transition-colors">
                    E{ep.episode_number}
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-display font-black uppercase tracking-widest rounded-sm ${
                    ep.status === 'LIVE' ? 'bg-latent-crimson/20 text-latent-crimson border border-latent-crimson/50 animate-pulse-fast' :
                    ep.status === 'UPCOMING' ? 'bg-white/5 text-white/50 border border-white/10' :
                    'bg-white/10 text-white border border-white/20'
                  }`}>
                    {ep.status}
                  </span>
                </div>

                <h3 className="text-2xl font-display font-black uppercase leading-tight mb-2 text-white">S{ep.season_number} — {ep.title}</h3>
                <div className="text-sm font-mono font-bold text-white/40">Air: {new Date(ep.air_date).toLocaleDateString()}</div>
              </div>

              <div className={`mt-8 text-sm font-display font-black uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-2 transition-transform ${ep.status === 'LIVE' ? 'text-latent-crimson' : 'text-latent-gold'}`}>
                {ep.status === 'LIVE' ? 'Vote Now' : ep.status === 'UPCOMING' ? 'Predict Now' : 'View Results'}
                <span>→</span>
              </div>
            </div>
          </Link>
        ))}

        {sorted.length === 0 && (
          <div className="col-span-full py-16 text-center text-white/30 font-display font-black uppercase tracking-widest text-xl border border-dashed border-white/10 rounded-md">
            No episodes logged. The acts are still preparing their sob stories. 🎻😭
          </div>
        )}
      </div>
    </div>
  );
}
