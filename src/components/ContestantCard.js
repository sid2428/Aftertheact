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
      className={`contestant-card brutal-surface relative overflow-hidden bg-brand-panel text-white ${
        isVotingLive ? "border-live" : ""
      }`}
    >

      {/* Contestant Header - High Contrast */}
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 border-b-4 border-white/10">
        <div className="contestant-image-wipe relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 border-4 border-white/15 bg-[#050505] overflow-hidden">
          {contestant.image_url ? (
            <Image
              src={contestant.image_url}
              alt={contestant.name}
              fill
              sizes="96px"
              className="object-cover grayscale hover:grayscale-0 transition-all duration-500"
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
      <div className="p-4 sm:p-6">
        {episodeStatus === "UPCOMING" && (
          <div className="text-center py-6 text-white/35 font-display font-black uppercase tracking-widest border-4 border-dashed border-white/10">
            Set lag raha hai. Come back when it&apos;s live.
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
