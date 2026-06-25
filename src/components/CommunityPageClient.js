"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MessageCircle, Flag, Trash2, Trophy, PenLine } from "lucide-react";

const COMPOSE_PROMPTS = ["Drop your take…", "Was that score actually fair?…", "Who got robbed tonight?…"];

// ponytail: all 5 reactions map to one like_count — no schema change; add reaction_type col when you need per-emoji analytics
const REACTIONS = [
  { emoji: "💀", label: "Dead" },
  { emoji: "🔥", label: "Slay" },
  { emoji: "😬", label: "Yikes" },
  { emoji: "👏", label: "Clap" },
  { emoji: "🗿", label: "Respectfully" },
];

function useCyclingPlaceholder(reduced) {
  const [placeholder, setPlaceholder] = useState(COMPOSE_PROMPTS[0]);
  useEffect(() => {
    if (reduced) return;
    let promptIdx = 0;
    let charIdx = 0;
    let deleting = false;
    let timer;
    const tick = () => {
      const full = COMPOSE_PROMPTS[promptIdx];
      if (!deleting) {
        charIdx += 1;
        setPlaceholder(full.slice(0, charIdx));
        if (charIdx >= full.length) {
          deleting = true;
          timer = setTimeout(tick, 1800);
          return;
        }
        timer = setTimeout(tick, 55);
      } else {
        charIdx -= 1;
        setPlaceholder(full.slice(0, charIdx));
        if (charIdx <= 0) {
          deleting = false;
          promptIdx = (promptIdx + 1) % COMPOSE_PROMPTS.length;
          timer = setTimeout(tick, 350);
          return;
        }
        timer = setTimeout(tick, 30);
      }
    };
    timer = setTimeout(tick, 1800);
    return () => clearTimeout(timer);
  }, [reduced]);
  return placeholder;
}

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function TagBadge({ post }) {
  if (post.Contestant?.name) {
    return <span className="text-[10px] font-display font-black uppercase tracking-widest bg-latent-gold/15 text-latent-gold px-2 py-0.5 border border-latent-gold/30 rounded-sm">{post.Contestant.name}</span>;
  }
  if (post.Episode) {
    return <span className="text-[10px] font-display font-black uppercase tracking-widest bg-latent-crimson/15 text-latent-crimson px-2 py-0.5 border border-latent-crimson/30 rounded-sm">S{post.Episode.season_number}E{post.Episode.episode_number}</span>;
  }
  return null;
}

function Avatar({ user, size = 40 }) {
  const px = { width: size, height: size };
  return (
    <div style={px} className="rounded-full overflow-hidden bg-[#0A0A0A] border border-white/10 flex items-center justify-center shrink-0">
      {user?.avatar_url ? (
        <img src={user.avatar_url} alt={user.username || ""} className="w-full h-full object-cover" />
      ) : (
        <span className="font-display font-black text-white/30 uppercase">{user?.username?.[0] || "?"}</span>
      )}
    </div>
  );
}

function PostCard({ post, currentUser, liked, onToggleLike, onDelete, onReport }) {
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyCount, setReplyCount] = useState(post.reply_count || 0);
  const [replyError, setReplyError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [myReaction, setMyReaction] = useState(null);
  // Optimistic like count so UI updates instantly before API returns.
  const [optimisticCount, setOptimisticCount] = useState(post.like_count || 0);
  const [optimisticLiked, setOptimisticLiked] = useState(liked);

  // Keep optimistic state in sync when parent updates (e.g. another post update).
  useEffect(() => { setOptimisticCount(post.like_count || 0); }, [post.like_count]);
  useEffect(() => { setOptimisticLiked(liked); }, [liked]);

  const loadReplies = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && replies === null) {
      const res = await fetch(`/api/community/posts/${post.id}/replies`);
      const json = await res.json();
      if (json.success) setReplies(json.data);
    }
  };

  const sendReply = async () => {
    const text = replyText.trim();
    if (!text || busy) return;
    setBusy(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/community/posts/${post.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (json.success) {
        setReplies((r) => [...(r || []), json.data]);
        setReplyCount((c) => c + 1);
        setReplyText("");
      } else {
        setReplyError(json.error || "Failed to reply.");
      }
    } catch {
      setReplyError("Network error. Try again.");
    }
    setBusy(false);
  };

  const handleReact = (emoji) => {
    if (!currentUser) return;
    // Optimistic update — feels instant.
    if (optimisticLiked) {
      // Already liked: any emoji click un-likes.
      setOptimisticLiked(false);
      setOptimisticCount((c) => Math.max(0, c - 1));
      setMyReaction(null);
    } else {
      // Not liked: like it with this emoji.
      setOptimisticLiked(true);
      setOptimisticCount((c) => c + 1);
      setMyReaction(emoji);
    }
    onToggleLike(post.id);
  };

  const isAuthor = currentUser && post.User?.id === currentUser.id;

  return (
    <div className="bg-[#111111] border border-white/[0.08] rounded-md p-5">
      <div className="flex items-center gap-3 mb-3">
        <Avatar user={post.User} />
        <div className="min-w-0">
          <div className="font-display font-bold uppercase tracking-wide text-white truncate">{post.User?.username || "Unknown"}</div>
          <div className="font-mono text-[11px] text-white/40">{timeAgo(post.created_at)}</div>
        </div>
        <div className="ml-auto"><TagBadge post={post} /></div>
      </div>

      <p className="text-[15px] text-white/90 leading-relaxed font-sans break-words">{post.text}</p>

      <div className="flex items-center gap-1 mt-4 flex-wrap">
        {REACTIONS.map(({ emoji, label }) => {
          const active = myReaction === emoji && optimisticLiked;
          return (
            <motion.button
              key={emoji}
              onClick={() => handleReact(emoji)}
              whileTap={{ scale: 1.35 }}
              title={label}
              aria-label={label}
              className={`rounded-full px-2.5 py-1 text-sm border transition-all duration-200 ${
                active
                  ? "border-latent-gold/50 bg-latent-gold/15 shadow-[0_0_10px_rgba(212,175,55,0.25)]"
                  : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:scale-105"
              }`}
            >
              {emoji}
            </motion.button>
          );
        })}

        {optimisticCount > 0 && (
          <span className={`ml-1 font-mono text-xs transition-colors ${optimisticLiked ? "text-latent-gold" : "text-white/40"}`}>
            {optimisticCount}
          </span>
        )}

        <div className="flex items-center gap-4 ml-auto text-white/50">
          <button onClick={loadReplies} className="flex items-center gap-1.5 text-sm hover:text-white transition-colors" aria-label="Replies">
            <MessageCircle size={16} />
            <span className="font-mono text-xs">{replyCount}</span>
          </button>

          <button onClick={() => onReport(post.id)} className="flex items-center gap-1.5 text-sm hover:text-latent-gold transition-colors" aria-label="Report">
            <Flag size={14} />
          </button>

          {isAuthor && (
            <button onClick={() => onDelete(post.id)} className="flex items-center gap-1.5 text-sm hover:text-latent-crimson transition-colors" aria-label="Delete">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
              {replies === null ? (
                <div className="text-white/30 text-sm font-mono">Loading…</div>
              ) : replies.length === 0 ? (
                <div className="text-white/30 text-sm font-mono">No replies yet.</div>
              ) : (
                replies.map((r) => (
                  <div key={r.id} className="flex items-start gap-2">
                    <Avatar user={r.User} size={28} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold uppercase text-xs text-white truncate">{r.User?.username || "Unknown"}</span>
                        <span className="font-mono text-[10px] text-white/30">{timeAgo(r.created_at)}</span>
                      </div>
                      <div className="text-sm text-white/80 break-words">{r.text}</div>
                    </div>
                  </div>
                ))
              )}

              {currentUser && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex gap-2">
                    <input
                      value={replyText}
                      onChange={(e) => { setReplyText(e.target.value); setReplyError(null); }}
                      onKeyDown={(e) => e.key === "Enter" && sendReply()}
                      maxLength={200}
                      placeholder="Reply…"
                      className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-sm px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-latent-gold/50 outline-none"
                    />
                    <button onClick={sendReply} disabled={busy || !replyText.trim()} className="bg-white/10 hover:bg-white/20 text-white font-display font-bold uppercase text-xs tracking-widest px-4 rounded-sm transition-colors disabled:opacity-50">
                      {busy ? "…" : "Reply"}
                    </button>
                  </div>
                  {replyError && <div className="text-latent-crimson font-mono text-xs">{replyError}</div>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CommunityPageClient({
  initialPosts, hotTakes, likedPostIds, stats, dbReady, contestants, episodes, episodeContestants = {}, currentUser,
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [liked, setLiked] = useState(new Set(likedPostIds));
  const [text, setText] = useState("");
  const [contestantTagId, setContestantTagId] = useState(""); // UUID or ""
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);
  const [justPosted, setJustPosted] = useState(false);
  const [reportId, setReportId] = useState(null);
  const [activeEpisode, setActiveEpisode] = useState(null); // null = all episodes
  const reduced = useReducedMotion();
  const composePlaceholder = useCyclingPlaceholder(reduced);

  // Reset contestant tag when switching episodes
  useEffect(() => {
    setContestantTagId("");
  }, [activeEpisode]);

  const visiblePosts = activeEpisode
    ? posts.filter((p) => p.episode_tag === activeEpisode.id)
    : posts;

  // Episode tab sets the episode tag; dropdown only controls contestant tag.
  const submitPost = async () => {
    const body = text.trim();
    if (!body || posting) return;
    setPosting(true);
    setError(null);

    const res = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: body,
        contestantTag: contestantTagId || null,
        episodeTag: activeEpisode?.id || null,
      }),
    });
    const json = await res.json();
    if (json.success) {
      setPosts((p) => [json.data, ...p]);
      setText("");
      setContestantTagId("");
      setJustPosted(true);
      setTimeout(() => setJustPosted(false), 2000);
    } else {
      setError(json.error || "Failed to post.");
    }
    setPosting(false);
  };

  const toggleLike = async (postId) => {
    if (!currentUser) return;
    const res = await fetch(`/api/community/posts/${postId}/like`, { method: "POST" });
    const json = await res.json();
    if (json.success) {
      setLiked((s) => {
        const n = new Set(s);
        if (json.data.liked) n.add(postId);
        else n.delete(postId);
        return n;
      });
      setPosts((p) => p.map((post) => (post.id === postId ? { ...post, like_count: json.data.likeCount } : post)));
    }
  };

  const deletePost = async (postId) => {
    const res = await fetch(`/api/community/posts/${postId}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) setPosts((p) => p.filter((post) => post.id !== postId));
  };

  const confirmReport = async () => {
    const id = reportId;
    setReportId(null);
    await fetch(`/api/community/posts/${id}/report`, { method: "POST" });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[45vh] flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,_var(--tw-gradient-stops))] from-latent-crimson/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-12 grid lg:grid-cols-2 gap-8 items-center relative z-10">
          <div className="space-y-5">
            <h1 className="text-6xl sm:text-8xl font-display font-black tracking-tighter uppercase text-white leading-[0.85]">
              THE GREEN<br />ROOM
            </h1>
            <p className="text-xl text-white/60 font-medium">No filter. No mercy. Just takes.</p>
            <div className="flex flex-wrap gap-3">
              <span className="bg-[#111111] border border-white/10 rounded-full px-4 py-1.5 font-mono text-xs text-white/70">{stats.postsToday} Posts Today</span>
              <span className="bg-[#111111] border border-white/10 rounded-full px-4 py-1.5 font-mono text-xs text-white/70">{stats.activeRoasters} Active Roasters</span>
              {stats.mostRoasted && (
                <span className="bg-[#111111] border border-white/10 rounded-full px-4 py-1.5 font-mono text-xs text-white/70">Most Roasted: {stats.mostRoasted}</span>
              )}
            </div>
          </div>

          {/* Decorative speech bubbles */}
          <div className="hidden lg:flex flex-wrap gap-4 justify-end opacity-90 relative top-10">
            {[
              ["Talent is relative 🔪", "bg-latent-gold/20 text-latent-gold border-latent-gold/50 shadow-[0_0_20px_rgba(212,175,55,0.25)]"],
              ["Judges were sus tbh", "bg-latent-crimson/20 text-latent-crimson border-latent-crimson/50 shadow-[0_0_20px_rgba(139,30,45,0.25)]"],
              ["Who approved that act?", "bg-white/10 text-white/80 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.15)]"],
              ["That was a 2/10 at best", "bg-latent-gold/20 text-latent-gold border-latent-gold/50 shadow-[0_0_20px_rgba(212,175,55,0.25)]"],
            ].map(([t, cls], i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -15, 0],
                  rotate: [[-3, 2, -2, 3][i] - 3, [-3, 2, -2, 3][i] + 3, [-3, 2, -2, 3][i] - 3]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 4 + i * 0.5,
                  ease: "easeInOut",
                  delay: i * 0.3
                }}
                className={`rounded-3xl border px-5 py-3 font-mono text-sm backdrop-blur-sm ${cls}`}
              >
                {t}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Episode tabs */}
      {episodes.length > 0 && (
        <div className="border-b border-white/10 bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6 sm:px-12 py-3 overflow-x-auto">
            <div className="flex gap-1.5 w-max">
              <button
                onClick={() => setActiveEpisode(null)}
                className={`px-4 py-2 rounded-full font-display text-xs uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                  !activeEpisode
                    ? "bg-latent-gold text-[#0A0A0A] shadow-[0_0_18px_rgba(212,175,55,0.4)]"
                    : "text-white/50 hover:text-white border border-white/10"
                }`}
              >
                All Episodes
              </button>
              {episodes.map((ep) => {
                const active = activeEpisode?.id === ep.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => setActiveEpisode(active ? null : ep)}
                    className={`px-4 py-2 rounded-full font-display text-xs uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                      active
                        ? "bg-latent-gold text-[#0A0A0A] shadow-[0_0_18px_rgba(212,175,55,0.4)]"
                        : "text-white/50 hover:text-white border border-white/10"
                    }`}
                  >
                    S{ep.season_number}E{ep.episode_number} — {ep.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 sm:px-12 pb-32 grid lg:grid-cols-[1fr_320px] gap-10 mt-8">
        {/* Feed */}
        <div className="space-y-6">
          {!dbReady && (
            <div className="bg-[#111111] border border-latent-gold/30 rounded-md p-6 text-white/70 font-mono text-sm">
              The Green Room isn&apos;t set up yet — run the community migrations to enable posting.
            </div>
          )}

          {/* Episode context header + create prompt */}
          {activeEpisode && (
            <div className="flex items-center justify-between gap-4 bg-white/[0.03] border border-latent-gold/20 rounded-md px-5 py-3">
              <div>
                <div className="font-display font-black uppercase tracking-widest text-latent-gold text-sm">
                  S{activeEpisode.season_number}E{activeEpisode.episode_number} — {activeEpisode.title}
                </div>
                <div className="font-mono text-xs text-white/40 mt-0.5">
                  {visiblePosts.length} take{visiblePosts.length !== 1 ? "s" : ""} on this episode
                </div>
              </div>
              {currentUser && (
                <button
                  onClick={() => document.getElementById("composer-textarea")?.focus()}
                  className="flex items-center gap-2 bg-latent-gold/15 hover:bg-latent-gold/25 border border-latent-gold/40 text-latent-gold font-display font-black uppercase text-xs tracking-widest px-4 py-2 rounded-full transition-all duration-200 shrink-0"
                >
                  <PenLine size={14} strokeWidth={2.5} />
                  Drop a Take
                </button>
              )}
            </div>
          )}

          {/* Composer */}
          {currentUser ? (
            <div className="bg-[#111111] border border-white/10 rounded-md p-5">
              <textarea
                id="composer-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={280}
                rows={3}
                placeholder={composePlaceholder}
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-sm p-3 font-mono text-sm text-white placeholder:text-white/30 focus:border-latent-gold/50 outline-none resize-none"
                style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, rgba(255,255,255,0.04) 28px)" }}
              />
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="font-mono text-xs text-white/40">{text.length} / 280</span>
                {(() => {
                  // When episode tab is active, show only that episode's contestants.
                  // When "All", show every contestant.
                  const options = activeEpisode
                    ? (episodeContestants[activeEpisode.id] || [])
                    : contestants;
                  return options.length > 0 ? (
                    <select
                      value={contestantTagId}
                      onChange={(e) => setContestantTagId(e.target.value)}
                      className="bg-[#0A0A0A] border border-latent-gold/30 rounded-sm px-3 py-1.5 font-display text-xs uppercase tracking-widest text-white/70 outline-none focus:border-latent-gold"
                    >
                      <option value="">About…</option>
                      {options.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  ) : null;
                })()}
                <button onClick={submitPost} disabled={posting || !text.trim()} className={`btn-primary ml-auto transition-all ${justPosted ? "!bg-green-700 !border-green-600" : ""}`}>
                  {posting ? "Posting…" : justPosted ? "Posted ✓" : "Drop the Mic 🎤"}
                </button>
              </div>
              {error && <div className="mt-2 text-latent-crimson font-mono text-xs">{error}</div>}
            </div>
          ) : (
            <div className="bg-[#111111] border border-white/10 rounded-md p-6 flex items-center justify-between gap-4">
              <span className="font-display font-bold uppercase tracking-widest text-white/70 text-sm">Sign in to drop your take</span>
              <Link href="/api/auth/signin" className="bg-gradient-to-r from-latent-gold to-[#B8860B] text-[#0A0A0A] font-display font-black uppercase text-xs tracking-widest px-5 py-2 rounded-sm">Sign In</Link>
            </div>
          )}

          {/* Posts */}
          {visiblePosts.map((post, i) => {
            const gated = !currentUser && i >= 3;
            return (
              <div key={post.id} className="relative">
                <div className={gated ? "blur-sm pointer-events-none select-none" : ""}>
                  <PostCard
                    post={post}
                    currentUser={currentUser}
                    liked={liked.has(post.id)}
                    onToggleLike={toggleLike}
                    onDelete={deletePost}
                    onReport={setReportId}
                  />
                </div>
              </div>
            );
          })}

          {/* Logged-out CTA */}
          {!currentUser && posts.length > 3 && (
            <div className="bg-gradient-to-r from-latent-crimson/20 to-latent-gold/10 border border-white/10 rounded-md p-6 text-center">
              <div className="font-display font-black uppercase tracking-widest text-white mb-3">Join the Jury to see more — and add your own take</div>
              <Link href="/api/auth/signin" className="inline-block bg-gradient-to-r from-latent-gold to-[#B8860B] text-[#0A0A0A] font-display font-black uppercase text-sm tracking-widest px-6 py-2.5 rounded-sm">Sign In</Link>
            </div>
          )}

          {visiblePosts.length === 0 && dbReady && (
            <div className="text-center py-16 text-white/30 font-display font-black uppercase tracking-widest">
              {activeEpisode ? "No takes on this episode yet. Be the first." : "No takes yet. Be the first."}
            </div>
          )}
        </div>

        {/* Leaderboard sidebar */}
        <aside className="hidden lg:block space-y-4">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-latent-gold" strokeWidth={2.5} />
            <h2 className="font-display font-black uppercase tracking-widest text-white">Leaderboard</h2>
          </div>
          <p className="font-mono text-[11px] text-white/30">Most reacted takes</p>
          {hotTakes.length === 0 ? (
            <div className="text-white/30 font-mono text-sm">Nothing trending yet.</div>
          ) : (
            hotTakes.map((p, i) => (
              <div key={p.id} className="bg-[#111111] border border-white/[0.08] rounded-md p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-display font-black text-latent-gold text-lg leading-none">#{i + 1}</span>
                  <span className="font-display font-bold uppercase text-xs text-white/60 truncate">{p.User?.username || "Unknown"}</span>
                  <TagBadge post={p} />
                </div>
                <p className="text-sm text-white/80 break-words line-clamp-3">{p.text}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-white/40 font-mono">
                  <span className="text-base">🔥</span>
                  <span>{p.like_count || 0} reactions</span>
                </div>
              </div>
            ))
          )}
        </aside>
      </div>

      {/* Report confirm modal */}
      <AnimatePresence>
        {reportId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
            onClick={() => setReportId(null)}
          >
            <div onClick={(e) => e.stopPropagation()} className="bg-[#111111] border border-latent-crimson/30 rounded-md p-6 max-w-sm w-full text-center">
              <div className="font-display font-black uppercase tracking-widest text-white mb-2">Report this post?</div>
              <p className="text-white/50 text-sm mb-6">Our showrunners will review it.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={confirmReport} className="btn-danger">Report</button>
                <button onClick={() => setReportId(null)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
