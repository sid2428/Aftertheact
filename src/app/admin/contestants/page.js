import { getServiceSupabase } from "@/lib/supabase";
import { saveUploadedImage } from "@/lib/uploadImage";
import { verifyAdmin } from "@/app/actions/admin";
import { revalidatePath } from "next/cache";
import ImageUploadField from "@/components/admin/ImageUploadField";

export const revalidate = 0;

const inputClass = "w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white";
const labelClass = "block text-xs font-bold uppercase text-neutral-500 mb-1";

export default async function AdminContestants({ searchParams }) {
  const sp = await searchParams;
  const episodeId = sp?.episode || "";
  const supabase = getServiceSupabase();

  const { data: episodes } = await supabase
    .from("Episode")
    .select("id, season_number, episode_number, title")
    .order("season_number", { ascending: false })
    .order("episode_number", { ascending: false });

  let appearances = [];
  if (episodeId) {
    const { data } = await supabase
      .from("ContestantEpisodeAppearance")
      .select("id, judge_average, latent_score, Contestant(id, name, talent_type, bio, image_url)")
      .eq("episode_id", episodeId);
    appearances = data || [];
  }

  async function createContestant(formData) {
    "use server";
    await verifyAdmin();
    const sb = getServiceSupabase();
    const epId = formData.get("episode_id");
    const name = formData.get("name");
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.floor(Math.random() * 100000);

    const imageFile = formData.get("image_file");
    const image_url = imageFile && imageFile.size > 0 ? await saveUploadedImage(imageFile, "contestants") : null;

    const { data: c } = await sb
      .from("Contestant")
      .insert({ name, slug, talent_type: formData.get("talent_type"), bio: formData.get("bio") || null, image_url })
      .select("id")
      .single();

    await sb.from("ContestantEpisodeAppearance").insert({
      contestant_id: c.id,
      episode_id: epId,
      judge_average: parseFloat(formData.get("judge_average") || 0),
      latent_score: parseFloat(formData.get("latent_score") || 0),
    });

    revalidatePath("/admin/contestants");
    revalidatePath(`/admin/episodes/${epId}`);
  }

  async function updateContestant(formData) {
    "use server";
    await verifyAdmin();
    const sb = getServiceSupabase();
    const id = formData.get("id");
    const epId = formData.get("episode_id");

    const update = {
      name: formData.get("name"),
      talent_type: formData.get("talent_type"),
      bio: formData.get("bio") || null,
    };

    const imageFile = formData.get("image_file");
    if (imageFile && imageFile.size > 0) {
      update.image_url = await saveUploadedImage(imageFile, "contestants");
    }

    await sb.from("Contestant").update(update).eq("id", id);
    revalidatePath("/admin/contestants");
    revalidatePath(`/admin/episodes/${epId}`);
  }

  async function deleteContestant(formData) {
    "use server";
    await verifyAdmin();
    const sb = getServiceSupabase();
    const epId = formData.get("episode_id");
    // Cascades to ContestantEpisodeAppearance via FK.
    await sb.from("Contestant").delete().eq("id", formData.get("id"));
    revalidatePath("/admin/contestants");
    revalidatePath(`/admin/episodes/${epId}`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Contestants</h1>
        <p className="text-neutral-400 mt-2">Pick an episode, then manage who&apos;s in it.</p>
      </div>

      <form className="flex items-end gap-3">
        <div className="flex-1 max-w-sm">
          <label className={labelClass}>Episode</label>
          <select name="episode" defaultValue={episodeId} className={inputClass}>
            <option value="">— Select an episode —</option>
            {episodes?.map((ep) => (
              <option key={ep.id} value={ep.id}>S{ep.season_number}E{ep.episode_number} — {ep.title}</option>
            ))}
          </select>
        </div>
        <button className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 px-4 rounded">View</button>
      </form>

      {!episodeId && <div className="text-neutral-500 italic">Select an episode above to manage its contestants.</div>}

      {episodeId && (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {appearances.length > 0 ? (
              appearances.map((a) => {
                const c = a.Contestant;
                return (
                  <form key={a.id} action={updateContestant} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex flex-wrap items-end gap-4">
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="episode_id" value={episodeId} />
                    <ImageUploadField name="image_file" defaultImage={c.image_url || ""} />
                    <div className="flex-1 min-w-[160px]">
                      <label className={labelClass}>Name</label>
                      <input name="name" defaultValue={c.name} required className={inputClass} />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                      <label className={labelClass}>Talent Type</label>
                      <input name="talent_type" defaultValue={c.talent_type || ""} className={inputClass} />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className={labelClass}>Bio</label>
                      <input name="bio" defaultValue={c.bio || ""} maxLength={280} className={inputClass} />
                    </div>
                    <button type="submit" className="text-rose-500 text-sm font-bold hover:underline">Save</button>
                    <button type="submit" formAction={deleteContestant} className="text-neutral-500 text-sm font-bold hover:underline hover:text-red-500">Delete</button>
                  </form>
                );
              })
            ) : (
              <div className="text-neutral-500 italic">No contestants in this episode yet.</div>
            )}
          </div>

          <div>
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl sticky top-8">
              <h2 className="text-xl font-bold mb-4">Add Contestant</h2>
              <form action={createContestant} className="space-y-4">
                <input type="hidden" name="episode_id" value={episodeId} />
                <div>
                  <label className={labelClass}>Name</label>
                  <input type="text" name="name" required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Talent Type</label>
                  <input type="text" name="talent_type" className={inputClass} placeholder="e.g. Standup, Juggling" />
                </div>
                <div>
                  <label className={labelClass}>Bio (Platform Voice)</label>
                  <textarea name="bio" maxLength={280} rows={3} className={`${inputClass} resize-none`} placeholder="Keep it nasty but fair..."></textarea>
                </div>
                <ImageUploadField name="image_file" label="Photo" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Judge Avg</label>
                    <input type="number" step="0.1" name="judge_average" defaultValue={0} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Self Score</label>
                    <input type="number" step="0.1" name="latent_score" defaultValue={0} className={inputClass} />
                  </div>
                </div>
                <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded transition-colors">
                  Add to Episode
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
