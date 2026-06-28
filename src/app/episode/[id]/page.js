import { getServiceSupabase } from "@/lib/supabase";
import ContestantCard from "@/components/ContestantCard";
import VotingSection from "@/components/VotingSection";
import RevelationSequence, { RevelationItem } from "@/components/RevelationSequence";
import RevealCountdown from "@/components/RevealCountdown";
import { triggerExpiredRevelation } from "@/app/actions/revelation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notFound } from "next/navigation";
import VotingWheelPageClient from "./VotingWheelPageClient";

export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = getServiceSupabase();
  const { data: episode } = await supabase
    .from("Episode")
    .select("title, season_number, episode_number")
    .eq("id", id)
    .single();

  if (!episode) return { title: "Episode" };
  return {
    title: `S${episode.season_number}E${episode.episode_number} - ${episode.title}`,
    description: `Verdicts and scores for ${episode.title}.`,
  };
}

function EpisodeStatusBadge({ status }) {
  const labels = {
    LIVE: "ABHI VOTE KAR",
    UPCOMING: "SET LAG RAHA HAI",
    REVEALED: "RESULT AA GAYA. COPE.",
    ARCHIVED: "ARCHIVE",
  };

  const tone =
    status === "LIVE"
      ? "bg-broadcast-red text-white border-broadcast-red"
      : status === "UPCOMING"
        ? "bg-brand-panel text-white/70 border-white/20"
        : "bg-[#120f02] text-oracle-gold border-oracle-gold";

  return (
    <span className={`inline-flex items-center gap-2 border-4 px-3 py-1 font-display text-xs font-black uppercase tracking-widest shadow-[var(--shadow-brutal-sm)] ${tone}`}>
      {status === "LIVE" && <span className="h-2.5 w-2.5 animate-pulse-fast bg-white" />}
      {labels[status] || status}
    </span>
  );
}

export default async function EpisodePage({ params, searchParams }) {
  const { id } = await params;
  const { notice } = (await searchParams) || {};
  const session = await getServerSession(authOptions);
  const supabase = getServiceSupabase();

  let { data: episode, error } = await supabase
    .from("Episode")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !episode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg p-6 selection:bg-broadcast-red/30">
        <div className="border-4 border-broadcast-red bg-brand-panel p-12 text-center shadow-[var(--shadow-brutal-red)]">
          <div className="font-display text-4xl font-black uppercase text-white">Episode not found.</div>
        </div>
      </div>
    );
  }

  if (episode.status === "LIVE" && episode.voting_window_close) {
    await triggerExpiredRevelation(episode.id);
    const { data: refreshedEpisode } = await supabase
      .from("Episode")
      .select("*")
      .eq("id", id)
      .single();
    if (refreshedEpisode) episode = refreshedEpisode;
  }

  if (episode.status === "ARCHIVED") {
    notFound();
  }

  // Appearances and the viewer's own votes are independent — fetch together.
  const [{ data: appearances }, votesRes] = await Promise.all([
    supabase
      .from("ContestantEpisodeAppearance")
      .select(`
        *,
        Contestant (*)
      `)
      .eq("episode_id", episode.id),
    session?.user?.id
      ? supabase
          .from("UserVote")
          .select("contestant_id, score")
          .eq("episode_id", episode.id)
          .eq("user_id", session.user.id)
      : Promise.resolve({ data: null }),
  ]);

  const sortedAppearances = appearances?.sort((a, b) => {
    if (episode.status === "REVEALED" || episode.status === "ARCHIVED") {
      return (a.latent_score || 0) - (b.latent_score || 0);
    }
    return a.id.localeCompare(b.id);
  }) || [];

  const isClosed = episode.status === "REVEALED" || episode.status === "ARCHIVED";
  const scored = sortedAppearances.filter((a) => a.latent_score != null);
  const finalAverage = scored.length
    ? scored.reduce((sum, a) => sum + a.latent_score, 0) / scored.length
    : null;
  const totalVotes = sortedAppearances.reduce((sum, a) => sum + (a.total_votes_raw || 0), 0);

  let userVotesMap = {};
  if (votesRes.data) {
    userVotesMap = votesRes.data.reduce((acc, v) => ({ ...acc, [v.contestant_id]: v.score }), {});
  }

  // ── LIVE: hand the entire viewport to the voting wheel ───────────────────
  if (episode.status === "LIVE" && sortedAppearances.length > 0) {
    return (
      <VotingWheelPageClient
        contestants={sortedAppearances.map((app) => ({
          id: app.Contestant.id,
          name: app.Contestant.name,
          tagline: app.Contestant.talent_type ?? null,
          initial: app.Contestant.name?.[0]?.toUpperCase() ?? "?",
          userVoteScore: userVotesMap[app.Contestant.id] ?? null,
        }))}
        episodeId={episode.id}
        revealAt={episode.voting_window_close ?? null}
        seasonLabel={`S${episode.season_number}E${episode.episode_number} · ${episode.title}`}
        showTitle="After The Act"
        isAuthenticated={!!session?.user}
      />
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-white selection:bg-broadcast-red/30">
      <header className="border-b-4 border-broadcast-red bg-[#080808] p-4 sm:p-6">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl font-black uppercase tracking-tight text-white sm:text-6xl">
                S{episode.season_number}E{episode.episode_number} - {episode.title}
              </h1>
              <EpisodeStatusBadge status={episode.status} />
            </div>
            <div className="font-mono text-sm font-black uppercase tracking-[var(--letter-spacing-scoreboard)] text-white/45">
              Aired: {new Date(episode.air_date).toLocaleDateString()}
            </div>
          </div>

          {episode.status === "LIVE" && (
            <div className="border-4 border-broadcast-red bg-broadcast-red px-5 py-3 font-display text-sm font-black uppercase tracking-widest text-white shadow-[var(--shadow-brutal-md)]">
              Live - Cast Your Verdict
            </div>
          )}
        </div>
      </header>




      <main className="mx-auto max-w-7xl space-y-12 p-4 sm:p-6 lg:p-12">
        {notice && (
          <div className="brutal-surface bg-[#120f02] p-6 font-mono font-black text-oracle-gold">
            <span className="mb-2 block font-display text-xs font-black uppercase tracking-widest text-oracle-gold/70">Notice:</span>
            {notice}
          </div>
        )}

        {episode.admin_note && (
          <div className="brutal-surface bg-brand-panel p-6 font-mono font-black text-white">
            <span className="mb-2 block font-display text-xs font-black uppercase tracking-widest text-broadcast-red">System Broadcast:</span>
            {episode.admin_note}
          </div>
        )}

        {episode.status === "UPCOMING" && (
          <div className="brutal-surface-lg flex flex-col items-start justify-between gap-6 bg-[#120f02] p-8 sm:flex-row sm:items-center">
            <div>
              <h2 className="mb-2 font-display text-4xl font-black uppercase tracking-tight text-oracle-gold">The Oracle Board is open</h2>
              <p className="max-w-2xl font-medium text-white/65">Lock in Top, Bottom, and Alignment before air time. Predictions locked. Bhai, ab sirf wait karo.</p>
            </div>
            <button className="brutal-button shrink-0 px-8 py-4 font-display font-black uppercase tracking-widest">
              Make Predictions
            </button>
          </div>
        )}

        <div className="space-y-8">
          <h2 className="border-b-4 border-broadcast-red pb-2 font-display text-5xl font-black uppercase tracking-tight text-white">
            The Lineup
          </h2>

          {episode.status === "LIVE" ? (
            <div className="relative">
              <div className="episode-pulse pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2" />
              <div className="relative">
                <VotingSection
                  episodeId={episode.id}
                  revealAt={episode.voting_window_close ?? null}
                  contestants={sortedAppearances.map((app) => ({
                    id: app.Contestant.id,
                    name: app.Contestant.name,
                    talent_type: app.Contestant.talent_type,
                    image_url: app.Contestant.image_url,
                    userVoteScore: userVotesMap[app.Contestant.id] ?? null,
                  }))}
                />
              </div>
            </div>
          ) : (
            <RevelationSequence isRevealed={episode.status === "REVEALED" || episode.status === "ARCHIVED"}>
              {sortedAppearances.map((app) => (
                <RevelationItem key={app.id}>
                  <ContestantCard
                    contestant={app.Contestant}
                    appearance={app}
                    episodeStatus={episode.status}
                  />
                </RevelationItem>
              ))}
            </RevelationSequence>
          )}

          {sortedAppearances.length === 0 && (
            <div className="border-4 border-dashed border-white/15 bg-brand-panel py-24 text-center font-display text-2xl font-black uppercase tracking-widest text-white/30">
              No contestants have been added to this episode yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
