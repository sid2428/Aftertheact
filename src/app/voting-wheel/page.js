import { getServiceSupabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notFound, redirect } from "next/navigation";
import VotingScoreWheelClient from "./VotingScoreWheelClient";

export const revalidate = 0;

export async function generateMetadata({ searchParams }) {
  const { episode: episodeId, contestant: contestantId } = await searchParams;
  if (!episodeId || !contestantId) {
    return { title: "Cast Your Verdict — After The Act" };
  }

  const supabase = getServiceSupabase();
  const { data: contestant } = await supabase
    .from("Contestant")
    .select("name, tagline")
    .eq("id", contestantId)
    .single();

  const { data: episode } = await supabase
    .from("Episode")
    .select("season_number, episode_number, title")
    .eq("id", episodeId)
    .single();

  return {
    title: contestant
      ? `Rate ${contestant.name} — After The Act`
      : "Cast Your Verdict — After The Act",
    description: episode
      ? `Live verdict for S${episode.season_number}E${episode.episode_number} · ${episode.title}`
      : "Cast your score for the act.",
  };
}

export default async function VotingWheelPage({ searchParams }) {
  const { episode: episodeId, contestant: contestantId } = await searchParams;

  // Require both params; redirect to episodes list if missing
  if (!episodeId || !contestantId) {
    redirect("/episodes");
  }

  const supabase = getServiceSupabase();
  const session = await getServerSession(authOptions);

  // Load episode
  const { data: episode } = await supabase
    .from("Episode")
    .select("id, title, season_number, episode_number, status, voting_window_close")
    .eq("id", episodeId)
    .single();

  if (!episode) notFound();

  // Voting only happens while an episode is LIVE. For any other status, send the
  // viewer to the episode page (it renders the right view per status) with a
  // short notice explaining why they can't vote here.
  if (episode.status !== "LIVE") {
    const notice =
      episode.status === "UPCOMING"
        ? "This episode isn't live yet — voting opens at air time."
        : "Voting has closed for this episode.";
    redirect(`/episode/${episodeId}?notice=${encodeURIComponent(notice)}`);
  }

  // Load contestant / appearance
  const { data: appearance } = await supabase
    .from("ContestantEpisodeAppearance")
    .select(`
      id,
      latent_score,
      Contestant (id, name, tagline, talent_type, image_url)
    `)
    .eq("episode_id", episodeId)
    .eq("contestant_id", contestantId)
    .single();

  if (!appearance) notFound();

  const contestant = appearance.Contestant;

  // Load existing vote for this user (if logged in)
  let existingScore = null;
  if (session?.user?.id) {
    const { data: vote } = await supabase
      .from("UserVote")
      .select("score")
      .eq("episode_id", episodeId)
      .eq("contestant_id", contestantId)
      .eq("user_id", session.user.id)
      .single();
    if (vote) existingScore = vote.score;
  }

  // Build act object for the wheel
  const act = {
    name: contestant?.name || "Unknown Act",
    tagline: contestant?.tagline || contestant?.talent_type || null,
    initial: contestant?.name?.[0]?.toUpperCase() || "?",
  };

  const seasonLabel = `S${episode.season_number}E${episode.episode_number} · ${episode.title}`;

  return (
    <VotingScoreWheelClient
      act={act}
      episodeId={episodeId}
      contestantId={contestantId}
      revealAt={episode.voting_window_close}
      userVoteScore={existingScore}
      isEpisodeClosed={false}
      seasonLabel={seasonLabel}
      showTitle="After The Act"
    />
  );
}
