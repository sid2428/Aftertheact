"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Crown, Zap } from "lucide-react";
import RollingNumber from "@/components/RollingNumber";

function getNameSizeClass(name) {
  if (!name) return "text-base sm:text-xl";
  if (name.length > 15) return "text-xs sm:text-sm";
  if (name.length > 11) return "text-sm sm:text-lg";
  return "text-base sm:text-xl";
}

// ─── Avatar ─────────────────────────────────────────────────────────────────
function Avatar({ user, highlight = false }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full"
      style={{
        width: 44,
        height: 44,
        boxShadow: highlight
          ? "0 0 0 2px #D4AF37, 0 0 18px rgba(212,175,55,0.45)"
          : "0 0 0 1px rgba(255,255,255,0.1)",
        background: "#111",
      }}
    >
      {highlight && (
        <Crown
          className="absolute right-[-1px] top-[-1px] z-10 h-3.5 w-3.5 text-latent-gold drop-shadow"
          strokeWidth={2.5}
        />
      )}
      {user.avatar_url ? (
        <Image src={user.avatar_url} alt={user.username} fill sizes="44px" className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-display text-lg font-black uppercase text-white/25">
          {user.username?.[0]}
        </div>
      )}
    </div>
  );
}

// ─── Rank number ─────────────────────────────────────────────────────────────
function Rank({ n, gold = false }) {
  const podium = ["#D4AF37", "#C0C0C0", "#CD7F32"];
  const color = n <= 3 ? podium[n - 1] : gold ? "#D4AF37" : "rgba(255,255,255,0.22)";
  return (
    <div
      className="w-9 sm:w-11 shrink-0 text-center font-display font-black text-lg sm:text-2xl leading-none"
      style={{ color, textShadow: n <= 3 ? `0 0 16px ${color}99` : "none" }}
    >
      #{n}
    </div>
  );
}

// ─── Single glass row ────────────────────────────────────────────────────────
function GlassRow({ children, highlight = false, goldBorder = false, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex items-center gap-3 sm:gap-4 px-4 py-3.5 sm:px-5 sm:py-4 rounded-2xl transition-all duration-300 cursor-default"
      style={{
        background: highlight
          ? "linear-gradient(135deg,rgba(212,175,55,0.10) 0%,rgba(212,175,55,0.04) 100%)"
          : "rgba(255,255,255,0.03)",
        border: goldBorder
          ? "1px solid rgba(212,175,55,0.38)"
          : "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: highlight
          ? "0 4px 24px rgba(212,175,55,0.10), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "0 2px 12px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Hover shimmer */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: "radial-gradient(circle at 50% 0%,rgba(255,255,255,0.055) 0%,transparent 70%)",
        }}
      />
      {children}
    </motion.div>
  );
}

// ─── Section card ────────────────────────────────────────────────────────────
function Section({ title, subtitle, icon: Icon, accentColor, children }) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between pb-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `${accentColor}1a`,
              border: `1px solid ${accentColor}44`,
            }}
          >
            <Icon size={15} style={{ color: accentColor }} strokeWidth={2.5} />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white">
            {title}
          </h2>
        </div>
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/28">
          {subtitle}
        </span>
      </div>

      <div
        className="rounded-3xl p-3 sm:p-4 space-y-2"
        style={{
          background: "rgba(255,255,255,0.018)",
          border: "1px solid rgba(255,255,255,0.055)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {children}
      </div>
    </section>
  );
}

function EmptyState({ text }) {
  return (
    <div
      className="rounded-2xl py-14 text-center font-display text-base font-black uppercase tracking-widest text-white/20"
      style={{ border: "1px dashed rgba(255,255,255,0.09)" }}
    >
      {text}
    </div>
  );
}

function SelfDivider() {
  return (
    <div className="pt-2 mt-2 border-t border-white/[0.06]">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-white/30">
        Your Position
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function LeaderboardClient({ topUsers, oracles, seasonSelf, oracleSelf, seasonNumber = 1 }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-14 pb-10 sm:pt-20 sm:pb-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(212,175,55,0.07),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(229,57,53,0.05),transparent_50%)]" />
        </div>
        <div className="mx-auto max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-full border border-latent-gold/30 bg-latent-gold/10 font-display text-[10px] uppercase tracking-widest text-latent-gold/80">
              <span className="w-1.5 h-1.5 rounded-full bg-latent-gold animate-pulse" />
              Season {seasonNumber} · Updated every 30s
            </span>
            <h1 className="text-4xl sm:text-7xl md:text-8xl font-display font-black uppercase tracking-tighter text-white leading-[0.9] mb-4">
              THE
              <br />
              <span style={{ color: "#D4AF37", textShadow: "0 0 60px rgba(212,175,55,0.28)" }}>
                LEADERBOARDS
              </span>
            </h1>
            <p className="mt-6 font-mono text-xs sm:text-sm text-white/40 tracking-widest uppercase leading-relaxed max-w-lg">
              Season standing on one side.
              <br className="sm:hidden" /> Oracle accuracy on the other.
            </p>
          </motion.div>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-6 pb-24 space-y-14">

        {/* ─ Season Standing ─ */}
        <Section title="Season Standing" subtitle="By Latent Pts" icon={Crown} accentColor="#D4AF37">
          {topUsers.length === 0 ? (
            <EmptyState text="No users ranked yet." />
          ) : (
            topUsers.map((user, idx) => (
              <GlassRow key={user.id} delay={idx * 0.045} highlight={idx === 0}>
                <Rank n={idx + 1} />
                <Avatar user={user} highlight={idx === 0} />
                <div className="min-w-0 flex-1 pr-2">
                  <div className={`font-display font-black uppercase tracking-tight text-white group-hover:text-latent-gold transition-colors duration-300 leading-[1.1] break-all line-clamp-2 ${getNameSizeClass(user.username)}`}>
                    {user.username}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <RollingNumber value={user.latent_points_season || 0} decimals={0} height={28} className="justify-end font-bold text-latent-crimson" />
                  <div className="font-display text-[9px] font-black uppercase tracking-widest text-white/30">Points</div>
                </div>
              </GlassRow>
            ))
          )}

          {seasonSelf && (
            <>
              <SelfDivider />
              <GlassRow highlight goldBorder>
                <Rank n={seasonSelf.rank} gold />
                <Avatar user={seasonSelf.user} highlight />
                <div className="min-w-0 flex-1 pr-2">
                  <div className={`font-display font-black uppercase tracking-tight text-latent-gold leading-[1.1] break-all line-clamp-2 ${getNameSizeClass(seasonSelf.user.username)}`}>
                    {seasonSelf.user.username}
                  </div>
                  <div className="font-mono text-[9px] text-white/38 mt-1 uppercase tracking-widest">
                    {seasonSelf.inTop ? "You · In the top 10" : "You"}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <RollingNumber value={seasonSelf.user.latent_points_season || 0} decimals={0} height={28} className="justify-end font-bold text-latent-crimson" />
                  <div className="font-display text-[9px] font-black uppercase tracking-widest text-white/30">Points</div>
                </div>
              </GlassRow>
            </>
          )}
        </Section>

        {/* ─ Prophet's Wall ─ */}
        <Section title="Prophet's Wall" subtitle="Oracle System" icon={Zap} accentColor="#4CAF50">
          {oracles.length === 0 ? (
            <EmptyState text="Oracle Board khaali hai. 5 episodes dekho pehle, bhai." />
          ) : (
            oracles.map((user, idx) => (
              <GlassRow key={user.id} delay={idx * 0.045} highlight={idx === 0}>
                <Rank n={idx + 1} />
                <Avatar user={user} highlight={idx === 0} />
                <div className="min-w-0 flex-1 pr-2">
                  <div className={`font-display font-black uppercase tracking-tight transition-colors duration-300 leading-[1.1] break-all line-clamp-2 ${idx === 0 ? "text-latent-gold" : "text-white group-hover:text-oracle-green"} ${getNameSizeClass(user.username)}`}>
                    {user.username}
                  </div>
                  {user.bio ? (
                    <div className="font-sans text-[10px] text-white/40 mt-1 line-clamp-1 pr-2">
                      {user.bio}
                    </div>
                  ) : (
                    <div className="font-mono text-[9px] text-white/40 mt-1 uppercase tracking-widest">
                      {user.oracle_qualifying_episodes} prediction{user.oracle_qualifying_episodes === 1 ? "" : "s"}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right min-w-[64px]">
                  <div className="flex items-baseline justify-end gap-0.5">
                    <RollingNumber value={(user.oracle_score || 0) * 100} decimals={1} height={24} className="justify-end font-bold text-oracle-green" />
                    <span className="font-number text-sm font-bold text-oracle-green">%</span>
                  </div>
                  <div className="font-display text-[9px] font-black uppercase tracking-widest text-white/30">Accuracy</div>
                </div>
              </GlassRow>
            ))
          )}

          {oracleSelf && (
            <>
              <SelfDivider />
              <GlassRow highlight goldBorder>
                <div className="w-9 sm:w-11 shrink-0 text-center font-display font-black text-lg sm:text-2xl text-latent-gold">
                  {oracleSelf.qualified ? `#${oracleSelf.rank}` : "—"}
                </div>
                <Avatar user={oracleSelf.user} highlight />
                <div className="min-w-0 flex-1 pr-2">
                  <div className={`font-display font-black uppercase tracking-tight text-latent-gold leading-[1.1] break-all line-clamp-2 ${getNameSizeClass(oracleSelf.user.username)}`}>
                    {oracleSelf.user.username}
                  </div>
                  {oracleSelf.user.bio ? (
                    <div className="font-sans text-[10px] text-white/40 mt-1 line-clamp-1 pr-2">
                      {oracleSelf.user.bio}
                    </div>
                  ) : (
                    <div className="font-mono text-[9px] text-white/40 mt-1 uppercase tracking-widest">
                      {oracleSelf.qualified ? "You · Top 10" : "You · Not ranked"}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right min-w-[64px]">
                  <div className="flex items-baseline justify-end gap-0.5">
                    <RollingNumber value={(oracleSelf.user.oracle_score || 0) * 100} decimals={1} height={24} className="justify-end font-bold text-oracle-green" />
                    <span className="font-number text-sm font-bold text-oracle-green">%</span>
                  </div>
                  <div className="font-display text-[9px] font-black uppercase tracking-widest text-white/30">Accuracy</div>
                </div>
              </GlassRow>
            </>
          )}
        </Section>

      </main>
    </div>
  );
}
