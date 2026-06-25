"use client";

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import LiveScoreboard from "./LiveScoreboard";
import TypeOnce from "./TypeOnce";
import ScrambleText from "./ScrambleText";
import FloatingRevealCountdown from "./FloatingRevealCountdown";

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function FeaturedEpisodeSection({ episode, scoreboardRows = [], initialPosts = [] }) {
  const [posts, setPosts] = useState(initialPosts);
  const isLive = episode?.status === "LIVE";

  useEffect(() => {
    const channel = supabase
      .channel("featured-community-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "CommunityPost" },
        (payload) => {
          const p = payload.new;
          if (!p || p.moderation_status !== "VISIBLE") return;
          setPosts((prev) => {
            if (prev.some((x) => x.id === p.id)) return prev;
            return [{ id: p.id, text: p.text, created_at: p.created_at, username: null, _new: true }, ...prev].slice(0, 6);
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!episode) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-12 relative z-20 perspective-1000">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-6 flex items-end justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-4">
            {isLive && <span className="h-3 w-3 rounded-full bg-latent-crimson animate-pulse-fast shadow-[0_0_12px_rgba(139,30,45,1)]" />}
            <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-tighter text-white">
              {isLive ? "Live Now" : "Latest Verdict"} <span className="text-white/40 font-light">— S{episode.season_number} E{episode.episode_number}</span>
            </h2>
          </div>
          <Link href={`/episode/${episode.id}`} className="group flex items-center gap-2 font-display text-sm uppercase tracking-widest text-latent-gold transition-colors">
            <span>Open episode</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        <div className="relative">
          {isLive && episode?.voting_window_close && (
            <FloatingRevealCountdown key={episode.voting_window_close} revealAt={episode.voting_window_close} />
          )}
          <div className="relative glass-panel grid grid-cols-1 overflow-hidden rounded-[2rem] shadow-[0_34px_90px_rgba(0,0,0,0.62)] lg:grid-cols-[55%_45%]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(245,217,123,0.12),transparent_34%),radial-gradient(circle_at_100%_72%,rgba(139,30,45,0.16),transparent_38%)]" />
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Left — Scoreboard */}
          <div className="p-6 sm:p-10 relative z-10">
            <h3 className="mb-6 font-display text-sm uppercase tracking-widest text-white/50 flex items-center gap-3">
              <span className="w-4 h-px bg-white/20" /> Scoreboard
            </h3>
            {scoreboardRows.length > 0 ? (
              <LiveScoreboard
                rows={scoreboardRows}
                topN={5}
                compact
                liveEpisodeId={isLive ? episode.id : null}
                revealOnMount={true}
                ariaLabel="Featured episode scoreboard"
              />
            ) : (
              <div className="glass-row rounded-2xl border border-dashed border-white/10 py-16 text-center">
                <p className="font-display uppercase tracking-widest text-white/30">Voting opens at air time</p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative z-10 border-t border-white/10 lg:border-l lg:border-t-0">
            <div className="pointer-events-none absolute inset-y-0 left-[-1px] hidden w-[2px] bg-gradient-to-b from-transparent via-latent-gold/70 via-[50%] to-latent-crimson/30 lg:block" />

            {/* Right — Community feed */}
            <div className="flex h-full flex-col bg-[#070707]/55 p-6 shadow-[inset_18px_0_40px_rgba(0,0,0,0.16)] sm:p-10">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-display text-sm uppercase tracking-widest text-white/50 flex items-center gap-3">
                  <span className="w-4 h-px bg-white/20" /> The Green Room
                </h3>
                <Link href="/community" className="group font-display text-[11px] uppercase tracking-widest text-latent-gold transition-colors">
                  Join <span className="transition-transform group-hover:translate-x-1 inline-block">→</span>
                </Link>
              </div>

              {posts.length > 0 ? (
                <ul className="flex flex-col gap-4 flex-1">
                  <AnimatePresence initial={false}>
                    {posts.map((p, index) => (
                      <motion.li
                        key={p.id}
                        layout
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="glass-row rounded-2xl border border-white/10 p-5 shadow-[0_14px_28px_rgba(0,0,0,0.28)] transition-colors hover:border-latent-gold/30 sm:p-6"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="rounded-full border border-latent-gold/20 bg-latent-gold/10 px-3 py-1 font-display text-xs uppercase tracking-widest text-latent-gold/90">
                            {p.username || "Anonymous"}
                          </span>
                          <span className="font-number text-xs font-semibold text-white/40">
                            {p._new ? (
                              <ScrambleText text={timeAgo(p.created_at)} delay={100} speed={30} />
                            ) : (
                              timeAgo(p.created_at)
                            )}
                          </span>
                        </div>
                        <p className="line-clamp-3 min-h-[3.2em] font-sans text-base leading-relaxed text-white/85">
                          {p._new || index === 0 ? (
                            <TypeOnce text={p.text} sessionKey={`green-room-post-${p.id}`} speed={24} />
                          ) : (
                            p.text
                          )}
                        </p>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              ) : (
                <div className="glass-row flex flex-1 items-center justify-center rounded-2xl border border-dashed border-white/10 text-center">
                  <p className="p-10 font-display uppercase tracking-widest text-white/40">No posts yet. Start the conversation.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </motion.div>
    </section>
  );
}
