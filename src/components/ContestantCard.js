import Image from "next/image";
import LiveVoting from "./LiveVoting";
import ControversyBadge from "./ControversyBadge";
import SplitFlapScoreboard from "./SplitFlapScoreboard";
import RevealOnView from "./RevealOnView";
import StaggerText from "./StaggerText";

export default function ContestantCard({ contestant, appearance, episodeStatus }) {
  const isVotingLive = episodeStatus === "LIVE";
  const isRevealed = episodeStatus === "REVEALED" || episodeStatus === "ARCHIVED";

  return (
    <RevealOnView
      className={`relative overflow-hidden rounded-md bg-[#111111] shadow-[0_0_20px_rgba(0,0,0,0.5)] ${
        isVotingLive ? "border-live" : "border border-brand-border"
      }`}
    >

      {/* Contestant Header - High Contrast */}
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 border-b border-brand-border bg-[#0A0A0A]">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 border border-brand-border bg-[#050505] overflow-hidden rounded-sm">
          {contestant.image_url ? (
            <Image
              src={contestant.image_url}
              alt={contestant.name}
              fill
              sizes="96px"
              className="object-cover grayscale hover:grayscale-0 transition-all duration-500"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-display text-4xl text-white/15">
              {contestant.name[0]}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h2 className="text-3xl font-display uppercase tracking-tight flex items-center gap-3 text-white">
              <StaggerText text={contestant.name} />
            </h2>
          </div>
          <div className="text-sm font-display font-bold text-latent-gold uppercase tracking-widest mt-1">
            {contestant.talent_type}
          </div>
          <p className="text-sm text-white/50 mt-3 line-clamp-3 font-medium leading-relaxed">
            {contestant.bio}
          </p>
        </div>
      </div>

      {/* Dynamic Content based on Status */}
      <div className="p-4 sm:p-6 bg-[#111111]">
        {episodeStatus === "UPCOMING" && (
          <div className="text-center py-6 text-white/30 font-display font-black uppercase tracking-widest border border-dashed border-white/10 rounded-sm">
            Voting opens at air time
          </div>
        )}

        {isVotingLive && (
          <LiveVoting
            episodeId={appearance.episode_id}
            contestantId={contestant.id}
          />
        )}

        {isRevealed && (
          <div className="space-y-6 mt-2">
            <SplitFlapScoreboard appearance={appearance} />

            {/* Controversy Flag */}
            {appearance.controversy_flag && (
              <ControversyBadge />
            )}

            {/* Roast Section Teaser */}
            <div className="pt-4">
              <h3 className="text-sm font-display font-black uppercase tracking-widest text-white/70 mb-2">The Roast</h3>
              <div className="text-sm text-white/40 italic font-medium">
                Scroll down to enter the roast section. Receipts only.
              </div>
            </div>
          </div>
        )}
      </div>
    </RevealOnView>
  );
}
