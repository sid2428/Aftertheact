import { getServiceSupabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import CommunityPageClient from "@/components/CommunityPageClient";

export const metadata = {
  title: "The Green Room",
  description: "No filter. No mercy. Just takes.",
};

export const revalidate = 0; // always fresh

const POST_SELECT = `
  id, text, like_count, reply_count, created_at, contestant_tag, episode_tag,
  User ( id, username, avatar_url ),
  Contestant ( id, name ),
  Episode ( id, season_number, episode_number, title )
`;

export default async function CommunityPage() {
  const session = await getServerSession(authOptions);
  const supabase = getServiceSupabase();

  let posts = [];
  let hotTakes = [];
  let likedPostIds = [];
  let dbReady = true;
  let stats = { postsToday: 0, activeRoasters: 0, mostRoasted: null };

  try {
    // The feed, the hot takes, and today's activity are independent — fetch together.
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const [postsRes, hotRes, todaysRes] = await Promise.all([
      supabase
        .from("CommunityPost")
        .select(POST_SELECT)
        .eq("moderation_status", "VISIBLE")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("CommunityPost")
        .select(POST_SELECT)
        .eq("moderation_status", "VISIBLE")
        .order("like_count", { ascending: false })
        .limit(5),
      supabase
        .from("CommunityPost")
        .select("user_id, contestant_tag, Contestant ( name )")
        .eq("moderation_status", "VISIBLE")
        .gte("created_at", startOfDay.toISOString())
        .limit(500),
    ]);
    if (postsRes.error) throw postsRes.error;
    posts = postsRes.data || [];
    hotTakes = hotRes.data || [];

    const todays = todaysRes.data;
    if (todays) {
      stats.postsToday = todays.length;
      stats.activeRoasters = new Set(todays.map((p) => p.user_id).filter(Boolean)).size;
      const tally = {};
      for (const p of todays) {
        if (p.Contestant?.name) tally[p.Contestant.name] = (tally[p.Contestant.name] || 0) + 1;
      }
      const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
      stats.mostRoasted = top ? top[0] : null;
    }

    if (session?.user && posts.length) {
      const { data: likes } = await supabase
        .from("CommunityPostLike")
        .select("post_id")
        .eq("user_id", session.user.id)
        .in("post_id", posts.map((p) => p.id));
      likedPostIds = (likes || []).map((l) => l.post_id);
    }
  } catch (err) {
    // Tables not migrated yet — degrade gracefully instead of crashing.
    console.error("community page load:", err.message);
    dbReady = false;
  }

  // Tag options for the composer.
  const [{ data: contestants }, { data: episodes }, { data: appearances }] = await Promise.all([
    supabase.from("Contestant").select("id, name").order("name").limit(200),
    supabase.from("Episode").select("id, season_number, episode_number, title").order("episode_number", { ascending: false }).limit(50),
    supabase.from("ContestantEpisodeAppearance").select("episode_id, Contestant(id, name)").limit(2000),
  ]);

  // Build episode_id → [{id, name}] map so the composer can filter by episode tab.
  const episodeContestants = {};
  for (const a of appearances || []) {
    if (a.Contestant) {
      if (!episodeContestants[a.episode_id]) episodeContestants[a.episode_id] = [];
      episodeContestants[a.episode_id].push(a.Contestant);
    }
  }

  return (
    <CommunityPageClient
      initialPosts={posts}
      hotTakes={hotTakes}
      likedPostIds={likedPostIds}
      stats={stats}
      dbReady={dbReady}
      contestants={contestants || []}
      episodes={episodes || []}
      episodeContestants={episodeContestants}
      currentUser={session?.user ? { id: session.user.id, isAdmin: !!session.user.isAdmin } : null}
    />
  );
}
