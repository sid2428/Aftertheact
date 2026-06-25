import { getServiceSupabase } from "@/lib/supabase";
import AdminDashboardClient from "@/components/AdminDashboardClient";

export const revalidate = 0; // Don't cache admin page

export default async function AdminPage() {
  const supabase = getServiceSupabase();

  // Fetch episodes
  const { data: episodes } = await supabase
    .from("Episode")
    .select("*, ContestantEpisodeAppearance(id)")
    .order("season_number", { ascending: false })
    .order("episode_number", { ascending: false });

  // Fetch held roasts
  const { data: heldRoasts } = await supabase
    .from("Roast")
    .select("*, User(username), Contestant(name)")
    .eq("moderation_status", "HELD")
    .order("created_at", { ascending: false });

  // Fetch reported community posts (derived dynamically from PostReport).
  let reportedPosts = [];
  try {
    const { data, error } = await supabase
      .from("CommunityPost")
      .select("id, text, created_at, User(username), PostReport(id)")
      .eq("moderation_status", "VISIBLE");
    if (error) throw error;
    
    if (data) {
      reportedPosts = data
        .filter((p) => p.PostReport && p.PostReport.length > 0)
        .map((p) => ({
          ...p,
          report_count: p.PostReport.length,
        }))
        .sort((a, b) => b.report_count - a.report_count);
    }
  } catch (err) {
    console.error("admin reported posts:", err.message);
  }

  return (
    <div className="space-y-12">
      <div className="border-b border-brand-border pb-4">
        <h2 className="text-5xl font-display font-black uppercase tracking-tighter text-white">The Switchboard</h2>
        <p className="text-white/60 font-medium mt-2 max-w-2xl">
          Control the flow of the show. Advance episodes from UPCOMING to LIVE to REVEALED. Add contestants and drop the hammer on bad roasts.
        </p>
      </div>

      <AdminDashboardClient initialEpisodes={episodes || []} initialRoasts={heldRoasts || []} initialReportedPosts={reportedPosts} />

    </div>
  );
}
