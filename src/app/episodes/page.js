import { getServiceSupabase } from "@/lib/supabase";
import EpisodeDirectory from "@/components/EpisodeDirectory";

export const revalidate = 60;

export default async function EpisodesPage() {
  const supabase = getServiceSupabase();
  const { data: episodes } = await supabase
    .from("Episode")
    .select("*")
    .order("episode_number", { ascending: false });

  return (
    <section className="max-w-7xl mx-auto p-6 sm:p-12 mt-12 mb-32 relative z-20">
      <EpisodeDirectory episodes={episodes || []} />
    </section>
  );
}
