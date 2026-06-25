"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ProfileCommentsPanel({ initialComments }) {
  const [comments, setComments] = useState(initialComments);
  const [deleteId, setDeleteId] = useState(null);

  const confirmDelete = async () => {
    const id = deleteId;
    setDeleteId(null);
    const res = await fetch(`/api/community/posts/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) setComments((c) => c.filter((post) => post.id !== id));
  };

  if (comments.length === 0) {
    return <div className="text-white/30 font-mono text-sm">No comments yet.</div>;
  }

  return (
    <>
      <div className="space-y-3">
        {comments.map((post) => (
          <div key={post.id} className="flex justify-between items-start gap-4 bg-[#050505] border border-brand-border rounded-sm p-4">
            <div className="min-w-0">
              {post.Episode && (
                <span className="text-[10px] font-display font-black uppercase tracking-widest bg-latent-crimson/15 text-latent-crimson px-2 py-0.5 border border-latent-crimson/30 rounded-sm">
                  S{post.Episode.season_number}E{post.Episode.episode_number}
                </span>
              )}
              <p className="text-sm text-white/80 break-words mt-2">{post.text}</p>
              <div className="font-mono text-[11px] text-white/40 mt-2">{timeAgo(post.created_at)}</div>
            </div>
            <button
              onClick={() => setDeleteId(post.id)}
              className="shrink-0 text-white/40 hover:text-latent-crimson transition-colors"
              aria-label="Delete comment"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
            onClick={() => setDeleteId(null)}
          >
            <div onClick={(e) => e.stopPropagation()} className="bg-[#111111] border border-latent-crimson/30 rounded-md p-6 max-w-sm w-full text-center">
              <div className="font-display font-black uppercase tracking-widest text-white mb-2">Delete this comment?</div>
              <p className="text-white/50 text-sm mb-6">This is permanent and can&apos;t be undone.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={confirmDelete} className="bg-latent-crimson text-white font-display font-black uppercase text-xs tracking-widest px-5 py-2.5 rounded-sm">Delete</button>
                <button onClick={() => setDeleteId(null)} className="glass-panel text-white font-display font-black uppercase text-xs tracking-widest px-5 py-2.5 rounded-sm">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
