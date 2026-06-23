"use client";

import { useState } from "react";
import { submitRoast, upvoteRoast } from "@/app/actions/roasts";
import RoastOfTheNightBadge from "./RoastOfTheNightBadge";

export default function RoastSection({ episodeId, contestantId, roasts, isArchived }) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const res = await submitRoast({ episodeId, contestantId, content });
    
    if (res.success) {
      if (res.status === "HELD") {
        alert("Your roast is in review. If it's clean, it'll be live shortly.");
      } else {
        setContent("");
        alert("Roast published.");
      }
    } else {
      alert(res.error);
    }
    
    setIsSubmitting(false);
  };

  const handleUpvote = async (roastId) => {
    const res = await upvoteRoast(roastId);
    if (!res.success) {
      alert(res.error);
    } else {
      alert("Upvoted!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-4 border-t border-brand-border pt-6">
        <h3 className="text-3xl font-display font-black uppercase tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">The Roast</h3>
        <p className="text-white/60 text-sm font-medium mt-1">
          Roast the act. The talent. The decision to walk on stage. Not the person's identity, religion, body, or caste. The internet is watching and so are we.
        </p>
      </div>

      {!isArchived ? (
        <form onSubmit={handleSubmit} className="mb-8 relative border border-brand-border rounded-md shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={280}
            placeholder="Drop a roast..."
            className="w-full bg-[#111111] p-4 text-white font-medium resize-none pr-24 focus:outline-none focus:bg-[#1A1A1A] transition-colors"
            rows={3}
          />
          <div className="absolute bottom-4 right-4 flex items-center gap-4">
            <span className={`text-xs font-mono font-bold ${content.length === 280 ? 'text-latent-crimson drop-shadow-[0_0_5px_rgba(139,30,45,0.5)]' : 'text-white/40'}`}>
              {content.length}/280
            </span>
            <button 
              type="submit" 
              disabled={isSubmitting || !content.trim()}
              className="bg-white text-[#0A0A0A] hover:bg-latent-gold hover:text-[#0A0A0A] px-6 py-2 font-display font-black uppercase tracking-widest text-sm disabled:opacity-50 transition-all rounded-sm shadow-[0_0_10px_rgba(255,255,255,0.2)] hover:shadow-[0_0_10px_rgba(212,175,55,0.4)] border border-transparent"
            >
              {isSubmitting ? "..." : "Send"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-[#050505] border border-brand-border rounded-md text-center text-white/40 font-display font-black uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          Window Closed. Read-only archive.
        </div>
      )}

      <div className="space-y-4">
        {roasts?.map(roast => (
          <div key={roast.id} className={`p-4 sm:p-6 border rounded-md shadow-[0_0_20px_rgba(0,0,0,0.4)] ${roast.is_pinned ? 'bg-latent-crimson/10 border-latent-crimson/50' : 'bg-[#111111] border-brand-border hover:border-white/20 hover:bg-[#151515] transition-colors'}`}>
            <div className="flex justify-between items-start mb-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg uppercase tracking-tight text-white">{roast.User?.username || "Unknown"}</span>
                {roast.is_pinned && <RoastOfTheNightBadge />}
              </div>
              <button 
                onClick={() => handleUpvote(roast.id)}
                className="flex items-center gap-2 text-white/40 hover:text-latent-crimson transition-colors group"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-y-1 transition-transform group-hover:drop-shadow-[0_0_5px_rgba(139,30,45,0.6)]"><path d="m18 15-6-6-6 6"/></svg>
                <span className="text-lg font-mono font-black">{roast.upvote_count}</span>
              </button>
            </div>
            <p className="text-white/80 font-medium text-base leading-relaxed whitespace-pre-wrap">
              {roast.content}
            </p>
          </div>
        ))}

        {(!roasts || roasts.length === 0) && (
          <div className="text-center py-12 text-white/30 font-display font-bold uppercase tracking-widest italic border border-dashed border-white/10 rounded-md">
            No roasts yet. Be the first to ruin their day.
          </div>
        )}
      </div>
    </div>
  );
}
