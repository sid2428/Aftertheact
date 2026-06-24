"use client";

import Link from "next/link";

export default function Error({ error, reset }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-[#111111] border border-latent-crimson/30 rounded-md p-10">
        <div className="font-display font-black uppercase tracking-widest text-latent-crimson text-sm mb-4">The Green Room is closed</div>
        <h1 className="font-display font-black uppercase tracking-tight text-white text-3xl mb-3">Couldn&apos;t load the takes</h1>
        <p className="text-white/50 font-mono text-xs mb-8 break-words">{error?.message || "An unexpected error occurred."}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => reset()} className="bg-latent-crimson text-white font-display font-black uppercase tracking-widest px-6 py-3 rounded-sm hover:shadow-[0_0_20px_rgba(139,30,45,0.6)] transition-all">Try Again</button>
          <Link href="/" className="glass-panel text-white font-display font-black uppercase tracking-widest px-6 py-3 rounded-sm hover:bg-white/10 transition-colors">Go Home</Link>
        </div>
      </div>
    </div>
  );
}
