import { getServiceSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export default async function AdminContestants() {
  const supabase = getServiceSupabase();
  const { data: contestants } = await supabase
    .from("Contestant")
    .select("*")
    .order("created_at", { ascending: false });

  async function createContestant(formData) {
    "use server";
    const supabaseServer = getServiceSupabase();
    
    const name = formData.get("name");
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const talent_type = formData.get("talent_type");
    const bio = formData.get("bio");
    const image_url = formData.get("image_url");
    const social_url = formData.get("social_url");
    
    await supabaseServer.from("Contestant").insert({
      name,
      slug,
      talent_type,
      bio,
      image_url,
      social_url
    });
    
    revalidatePath("/admin/contestants");
  }

  async function setContestantImage(formData) {
    "use server";
    const sb = getServiceSupabase();
    await sb.from("Contestant").update({ image_url: formData.get("image_url") || null }).eq("id", formData.get("id"));
    revalidatePath("/admin/contestants");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Contestants</h1>
        <p className="text-neutral-400 mt-2">Manage the people brave enough to show up.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {contestants && contestants.length > 0 ? (
            contestants.map((c) => (
              <div key={c.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="w-12 h-12 rounded-full object-cover border border-neutral-700" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-neutral-600">
                      {c.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      {c.name}
                      {c.is_removed_by_request && <span className="text-xs bg-red-900/50 text-red-400 px-2 rounded">REMOVED</span>}
                    </div>
                    <div className="text-sm text-neutral-500">{c.talent_type}</div>
                  </div>
                </div>
                <form action={setContestantImage} className="flex gap-2 items-center">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="url" name="image_url" defaultValue={c.image_url || ""} placeholder="Photo URL" className="bg-neutral-800 border border-neutral-700 rounded p-1.5 text-white text-sm w-48" />
                  <button className="text-rose-500 text-sm font-bold hover:underline">Save</button>
                </form>
              </div>
            ))
          ) : (
            <div className="text-neutral-500 italic">No contestants exist yet.</div>
          )}
        </div>

        <div>
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl sticky top-8">
            <h2 className="text-xl font-bold mb-4">Add Contestant</h2>
            <form action={createContestant} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Name</label>
                <input type="text" name="name" required className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Talent Type</label>
                <input type="text" name="talent_type" className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white" placeholder="e.g. Standup, Juggling" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Bio (Platform Voice)</label>
                <textarea name="bio" maxLength={280} rows={3} className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white resize-none" placeholder="Keep it nasty but fair..."></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Image URL (Social)</label>
                <input type="url" name="image_url" className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Social Link (Attribution)</label>
                <input type="url" name="social_url" className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white" placeholder="https://instagram.com/..." />
              </div>
              <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded transition-colors">
                Add to Database
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
