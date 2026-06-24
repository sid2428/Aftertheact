import { getPanelMembers, MAX_PANEL } from "@/lib/panel";
import { savePanelMembers } from "@/app/actions/admin";

export const revalidate = 0;

const inputClass = "w-full bg-[#050505] text-white border border-brand-border p-2 font-mono font-bold rounded-sm focus:border-latent-gold outline-none";

export default async function AdminPanel() {
  const members = await getPanelMembers();
  const slots = Array.from({ length: MAX_PANEL }, (_, i) => members[i] || { name: "", image: "" });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-display font-black uppercase text-white">Hero Panel</h1>
        <p className="text-white/50 mt-1">Up to {MAX_PANEL} member faces flank the logo in the homepage hero. Paste an image URL/path for now — file upload comes later.</p>
      </div>

      <form action={savePanelMembers} className="bg-[#111111] border border-brand-border p-6 rounded-md space-y-5">
        {slots.map((m, i) => (
          <div key={i} className="grid sm:grid-cols-[40px_1fr_2fr] gap-4 items-center">
            <div className="font-display font-black text-white/30 text-2xl text-center">{i + 1}</div>
            <input name={`name_${i}`} defaultValue={m.name} placeholder="Name" className={inputClass} />
            <input name={`image_${i}`} defaultValue={m.image} placeholder="Image URL or /path.png" className={inputClass} />
          </div>
        ))}
        <button className="bg-latent-gold text-[#0A0A0A] px-6 py-2 font-display font-black uppercase rounded-sm hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all">Save Panel</button>
      </form>
    </div>
  );
}
