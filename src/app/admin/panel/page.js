import { getPanelMembers, DEFAULT_JUDGE_TAGS } from "@/lib/panel";
import JudgesManager from "@/components/admin/JudgesManager";

export const revalidate = 0;

export default async function AdminPanel() {
  const members = await getPanelMembers();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-display font-black uppercase text-white">Hero Panel</h1>
        <p className="text-white/50 mt-1">Judges flanking the logo in the homepage hero and rated on the Judge the Judges page. Add as many as you like; the hero cycles through everyone flagged to show. Add, edit, or delete them individually below.</p>
      </div>

      <JudgesManager initialJudges={members} defaultTags={DEFAULT_JUDGE_TAGS} />
    </div>
  );
}
