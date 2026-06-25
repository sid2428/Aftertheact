import { getPanelMembers, MAX_PANEL } from "@/lib/panel";
import { savePanelMembers } from "@/app/actions/admin";
import ImageUploadField from "@/components/admin/ImageUploadField";

export const revalidate = 0;

const inputClass = "w-full bg-[#050505] text-white border border-brand-border p-2 font-mono font-bold rounded-sm focus:border-latent-gold outline-none";

export default async function AdminPanel() {
  const members = await getPanelMembers();
  const slots = Array.from({ length: MAX_PANEL }, (_, i) => members[i] || { id: "", name: "", image: "", descriptor: "", instagram_handle: "", bio: "" });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-display font-black uppercase text-white">Hero Panel</h1>
        <p className="text-white/50 mt-1">Up to {MAX_PANEL} member faces flank the logo in the homepage hero and are rated on the Judge the Judges page. Clear a slot's name to delete that judge.</p>
      </div>

      <form action={savePanelMembers} className="bg-[#111111] border border-brand-border p-6 rounded-md space-y-6">
        {slots.map((m, i) => (
          <div key={i} className="border-b border-brand-border last:border-0 pb-5 last:pb-0 space-y-3">
            <div className="font-display font-black text-white/30 text-lg uppercase tracking-widest">Judge {i + 1}</div>
            <input type="hidden" name={`id_${i}`} defaultValue={m.id || ""} />
            <input type="hidden" name={`existing_image_${i}`} defaultValue={m.image || ""} />
            <div className="grid sm:grid-cols-2 gap-3">
              <input name={`name_${i}`} defaultValue={m.name} placeholder="Name" className={inputClass} />
              <input name={`descriptor_${i}`} defaultValue={m.descriptor} placeholder="Descriptor (e.g. The Wildcard)" className={inputClass} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3 items-start">
              <ImageUploadField name={`image_${i}`} defaultImage={m.image || ""} />
              <input name={`instagram_${i}`} defaultValue={m.instagram_handle} placeholder="@instagram_handle" className={inputClass} />
            </div>
            <textarea name={`bio_${i}`} defaultValue={m.bio} placeholder="Short bio (1–2 sentences)" rows={2} className={inputClass} />
          </div>
        ))}
        <button className="bg-latent-gold text-[#0A0A0A] px-6 py-2 font-display font-black uppercase rounded-sm hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all">Save Panel</button>
      </form>
    </div>
  );
}
