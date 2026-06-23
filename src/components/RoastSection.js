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
      <div className="mb-4 border-t-4 border-brand-black pt-6">
        <h3 className="text-3xl font-display font-black uppercase tracking-tighter text-brand-black">The Roast</h3>
        <p className="text-brand-black/60 text-sm font-medium mt-1">
          Roast the act. The talent. The decision to walk on stage. Not the person's identity, religion, body, or caste. The internet is watching and so are we.
        </p>
      </div>

      {!isArchived ? (
        <form onSubmit={handleSubmit} className="mb-8 relative border-4 border-brand-black">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={280}
            placeholder="Drop a roast..."
            className="w-full bg-white p-4 text-brand-black font-medium resize-none pr-24 focus:outline-none focus:bg-brand-gray/30 transition-colors"
            rows={3}
          />
          <div className="absolute bottom-4 right-4 flex items-center gap-4">
            <span className={`text-xs font-mono font-bold ${content.length === 280 ? 'text-broadcast-red' : 'text-brand-black/50'}`}>
              {content.length}/280
            </span>
            <button 
              type="submit" 
              disabled={isSubmitting || !content.trim()}
              className="bg-brand-black text-white hover:bg-broadcast-red px-6 py-2 font-display font-black uppercase tracking-widest text-sm disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "..." : "Send"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-brand-gray border-4 border-brand-black text-center text-brand-black/50 font-display font-black uppercase tracking-widest text-sm">
          Window Closed. Read-only archive.
        </div>
      )}

      <div className="space-y-4">
        {roasts?.map(roast => (
          <div key={roast.id} className={`p-4 sm:p-6 border-4 ${roast.is_pinned ? 'bg-broadcast-red/10 border-broadcast-red' : 'bg-white border-brand-black hover:border-brand-black/70'}`}>
            <div className="flex justify-between items-start mb-3 border-b-2 border-brand-black/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg uppercase tracking-tight text-brand-black">{roast.User?.username || "Unknown"}</span>
                {roast.is_pinned && <RoastOfTheNightBadge />}
              </div>
              <button 
                onClick={() => handleUpvote(roast.id)}
                className="flex items-center gap-2 text-brand-black/50 hover:text-broadcast-red transition-colors group"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-y-1 transition-transform"><path d="m18 15-6-6-6 6"/></svg>
                <span className="text-lg font-mono font-black">{roast.upvote_count}</span>
              </button>
            </div>
            <p className="text-brand-black font-medium text-base leading-relaxed whitespace-pre-wrap">
              {roast.content}
            </p>
          </div>
        ))}

        {(!roasts || roasts.length === 0) && (
          <div className="text-center py-12 text-brand-black/40 font-display font-bold uppercase tracking-widest italic border-4 border-dashed border-brand-black/20">
            No roasts yet. Be the first to ruin their day.
          </div>
        )}
      </div>
    </div>
  );
}
