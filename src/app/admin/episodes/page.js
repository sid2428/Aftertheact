import { getServiceSupabase } from "@/lib/supabase";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function AdminEpisodes() {
  const supabase = getServiceSupabase();
  const { data: episodes } = await supabase
    .from("Episode")
    .select("*")
    .order("season_number", { ascending: false })
    .order("episode_number", { ascending: false });

  async function createEpisode(formData) {
    "use server";
    const supabaseServer = getServiceSupabase();
    
    const season = parseInt(formData.get("season"));
    const episode = parseInt(formData.get("episode"));
    const title = formData.get("title");
    const airDate = formData.get("airDate");
    
    await supabaseServer.from("Episode").insert({
      season_number: season,
      episode_number: episode,
      title: title,
      air_date: new Date(airDate).toISOString(),
    });
    
    revalidatePath("/admin/episodes");
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black">Episodes</h1>
          <p className="text-neutral-400 mt-2">Manage the season calendar and triggers.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {episodes && episodes.length > 0 ? (
            episodes.map((ep) => (
              <div key={ep.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <div className="font-bold">S{ep.season_number}E{ep.episode_number} — {ep.title}</div>
                  <div className="text-sm text-neutral-500">Airs: {new Date(ep.air_date).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${ep.status === 'LIVE' ? 'bg-red-500/20 text-red-500' : 'bg-neutral-800 text-neutral-400'}`}>
                    {ep.status}
                  </span>
                  <Link href={`/admin/episodes/${ep.id}`} className="text-sm text-rose-500 hover:underline">Manage</Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-neutral-500 italic">No episodes exist yet.</div>
          )}
        </div>

        <div>
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl sticky top-8">
            <h2 className="text-xl font-bold mb-4">Create Episode</h2>
            <form action={createEpisode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Season</label>
                <input type="number" name="season" required className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white" defaultValue={1} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Episode</label>
                <input type="number" name="episode" required className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Title</label>
                <input type="text" name="title" required className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white" placeholder="e.g. Auditions Part 1" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Air Date (Local Time)</label>
                <input type="datetime-local" name="airDate" required className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white" />
              </div>
              <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded transition-colors">
                Publish Episode
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
