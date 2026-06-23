import LiveVoting from "./LiveVoting";
import { cn } from "@/lib/utils";
import ControversyBadge from "./ControversyBadge";
import SplitFlapScoreboard from "./SplitFlapScoreboard";

export default function ContestantCard({ contestant, appearance, episodeStatus }) {
  const isVotingLive = episodeStatus === "LIVE";
  const isRevealed = episodeStatus === "REVEALED" || episodeStatus === "ARCHIVED";

  return (
    <div className="bg-white border-4 border-brand-black relative">
      
      {/* Contestant Header - High Contrast */}
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 border-b-4 border-brand-black">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 border-4 border-brand-black bg-brand-gray overflow-hidden">
          {contestant.image_url ? (
            <img src={contestant.image_url} alt={contestant.name} className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-display font-black text-4xl text-brand-black/30">
              {contestant.name[0]}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h2 className="text-3xl font-display font-black uppercase tracking-tight flex items-center gap-3 text-brand-black">
              {contestant.name}
            </h2>
          </div>
          <div className="text-sm font-display font-bold text-broadcast-red uppercase tracking-widest mt-1">
            {contestant.talent_type}
          </div>
          <p className="text-sm text-brand-black/70 mt-3 line-clamp-3 font-medium leading-relaxed">
            {contestant.bio}
          </p>
        </div>
      </div>

      {/* Dynamic Content based on Status */}
      <div className="p-4 sm:p-6 bg-brand-white">
        {episodeStatus === "UPCOMING" && (
          <div className="text-center py-6 text-brand-black/50 font-display font-black uppercase tracking-widest border-2 border-dashed border-brand-black/20">
            Voting opens at air time
          </div>
        )}

        {isVotingLive && (
          <LiveVoting 
            episodeId={appearance.episode_id} 
            contestantId={contestant.id} 
            initialRawScore={appearance.peoples_verdict_raw} 
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
              <h3 className="text-sm font-display font-black uppercase tracking-widest text-brand-black mb-2">The Roast</h3>
              <div className="text-sm text-brand-black/60 italic font-medium">
                Scroll down to enter the roast section. Receipts only.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
