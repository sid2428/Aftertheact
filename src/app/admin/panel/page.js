import { getPanelMembers, MAX_PANEL, DEFAULT_JUDGE_TAGS } from "@/lib/panel";
import JudgesManager from "@/components/admin/JudgesManager";

export const revalidate = 0;

export default async function AdminPanel() {
  const members = await getPanelMembers();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-display font-black uppercase text-white">Hero Panel</h1>
        <p className="text-white/50 mt-1">Up to {MAX_PANEL} judges flank the logo in the homepage hero and are rated on the Judge the Judges page. Add, edit, or delete them individually below.</p>
      </div>

      <JudgesManager initialJudges={members} maxPanel={MAX_PANEL} defaultTags={DEFAULT_JUDGE_TAGS} />
    </div>
  );
}
