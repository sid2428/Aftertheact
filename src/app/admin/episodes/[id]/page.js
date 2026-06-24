import { getServiceSupabase } from "@/lib/supabase";
import { updateEpisode, removeAppearance } from "@/app/actions/admin";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 0;

const inputClass = "w-full bg-[#050505] text-white border border-brand-border p-2 font-mono font-bold rounded-sm focus:border-latent-gold outline-none";
const labelClass = "block text-xs font-display font-black uppercase text-white/50 mb-1";

export default async function ManageEpisode({ params }) {
  const { id } = await params;
  const supabase = getServiceSupabase();

  const { data: episode } = await supabase.from("Episode").select("*").eq("id", id).single();
  if (!episode) notFound();

  const { data: appearances } = await supabase
    .from("ContestantEpisodeAppearance")
    .select("id, latent_score, judge_average, Contestant(name, talent_type)")
    .eq("episode_id", id);

  // ponytail: inline server action — add a contestant to this episode (FormData-native form)
  async function addContestant(formData) {
    "use server";
    const sb = getServiceSupabase();
    const name = formData.get("name");
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.floor(Math.random() * 1000);
    const { data: c } = await sb.from("Contestant").insert({ name, slug, talent_type: formData.get("talent_type"), image_url: formData.get("image_url") || null }).select("id").single();
    await sb.from("ContestantEpisodeAppearance").insert({
      contestant_id: c.id,
      episode_id: id,
      judge_average: parseFloat(formData.get("judge_average") || 0),
      latent_score: parseFloat(formData.get("latent_score") || 0),
    });
    revalidatePath(`/admin/episodes/${id}`);
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <Link href="/admin/episodes" className="text-sm text-latent-gold hover:underline">← All Episodes</Link>

      <div>
        <h1 className="text-3xl font-display font-black uppercase text-white">Manage S{episode.season_number}E{episode.episode_number}</h1>
        <p className="text-white/50 mt-1 font-mono text-sm">Status: {episode.status}</p>
      </div>

      {/* Episode fields */}
      <form action={updateEpisode} className="bg-[#111111] border border-brand-border p-6 rounded-md space-y-4">
        <input type="hidden" name="episode_id" value={episode.id} />
        <h2 className="text-xl font-display font-black uppercase text-white border-b border-white/10 pb-2">Episode Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelClass}>Season</label><input type="number" name="season_number" defaultValue={episode.season_number} required className={inputClass} /></div>
          <div><label className={labelClass}>Episode</label><input type="number" name="episode_number" defaultValue={episode.episode_number} required className={inputClass} /></div>
        </div>
        <div><label className={labelClass}>Title</label><input type="text" name="title" defaultValue={episode.title} required className={inputClass} /></div>
        <div><label className={labelClass}>Air Date</label><input type="datetime-local" name="air_date" defaultValue={new Date(episode.air_date).toISOString().slice(0, 16)} required className={inputClass} /></div>
        <div><label className={labelClass}>Admin Note</label><textarea name="admin_note" defaultValue={episode.admin_note || ""} rows={2} className={inputClass} /></div>
        <button className="bg-latent-gold text-[#0A0A0A] px-6 py-2 font-display font-black uppercase rounded-sm hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all">Save Changes</button>
      </form>

      {/* Lineup */}
      <div className="bg-[#111111] border border-brand-border p-6 rounded-md space-y-4">
        <h2 className="text-xl font-display font-black uppercase text-white border-b border-white/10 pb-2">Lineup ({appearances?.length || 0})</h2>
        {appearances?.map((a) => (
          <div key={a.id} className="flex justify-between items-center bg-[#050505] border border-brand-border p-3 rounded-sm">
            <div>
              <div className="font-display font-black uppercase text-white">{a.Contestant?.name}</div>
              <div className="text-xs font-mono text-white/40">{a.Contestant?.talent_type} • Self Score: {a.latent_score ?? "—"}</div>
            </div>
            <form action={removeAppearance}>
              <input type="hidden" name="appearance_id" value={a.id} />
              <input type="hidden" name="episode_id" value={episode.id} />
              <button className="text-latent-crimson text-xs font-display font-black uppercase hover:text-white transition-colors">Remove</button>
            </form>
          </div>
        ))}
        {(!appearances || appearances.length === 0) && <div className="text-white/30 font-mono text-sm">No contestants yet.</div>}
      </div>

      {/* Add contestant */}
      <form action={addContestant} className="bg-[#111111] border border-brand-border p-6 rounded-md space-y-4">
        <h2 className="text-xl font-display font-black uppercase text-white border-b border-white/10 pb-2">Add Contestant</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelClass}>Name</label><input type="text" name="name" required className={inputClass} /></div>
          <div><label className={labelClass}>Talent</label><input type="text" name="talent_type" required className={inputClass} /></div>
        </div>
        <div><label className={labelClass}>Profile Photo URL</label><input type="url" name="image_url" placeholder="https://..." className={inputClass} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelClass}>Judge Avg</label><input type="number" step="0.1" name="judge_average" defaultValue={0} className={inputClass} /></div>
          <div><label className={labelClass}>Self Score</label><input type="number" step="0.1" name="latent_score" defaultValue={0} className={inputClass} /></div>
        </div>
        <button className="bg-white/10 text-white px-6 py-2 font-display font-black uppercase rounded-sm hover:bg-white hover:text-[#0A0A0A] transition-colors">Add to Lineup</button>
      </form>
    </div>
  );
}
