import { getServiceSupabase } from "@/lib/supabase";
import { deleteUserActivity, updateRoast } from "@/app/actions/admin";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 0;

function DeleteButton({ kind, id, userId }) {
  return (
    <form action={deleteUserActivity}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="user_id" value={userId} />
      <button className="text-latent-crimson text-xs font-display font-black uppercase hover:text-white transition-colors">Delete</button>
    </form>
  );
}

export default async function ManageUser({ params }) {
  const { id } = await params;
  const supabase = getServiceSupabase();

  const { data: user } = await supabase.from("User").select("*").eq("id", id).single();
  if (!user) notFound();

  const [{ data: votes }, { data: predictions }, { data: roasts }] = await Promise.all([
    supabase.from("UserVote").select("id, score, Contestant(name), Episode(season_number, episode_number)").eq("user_id", id),
    supabase.from("UserPrediction").select("id, points_earned, Episode(season_number, episode_number)").eq("user_id", id),
    supabase.from("Roast").select("id, content, moderation_status, Contestant(name)").eq("user_id", id),
  ]);

  return (
    <div className="space-y-8 max-w-4xl">
      <Link href="/admin/users" className="text-sm text-latent-gold hover:underline">← All Users</Link>

      <div>
        <h1 className="text-3xl font-display font-black uppercase text-white">{user.username}</h1>
        <p className="text-white/50 font-mono text-sm mt-1">{user.email} • {user.latent_points_alltime} pts • trust {user.trust_score?.toFixed?.(2)}</p>
      </div>

      {/* Roasts (editable) */}
      <section className="bg-[#111111] border border-brand-border p-6 rounded-md space-y-3">
        <h2 className="text-xl font-display font-black uppercase text-white border-b border-white/10 pb-2">Roasts ({roasts?.length || 0})</h2>
        {roasts?.map((r) => (
          <div key={r.id} className="bg-[#050505] border border-brand-border p-3 rounded-sm space-y-2">
            <div className="flex justify-between text-xs font-mono text-white/40">
              <span>Target: {r.Contestant?.name} • {r.moderation_status}</span>
              <DeleteButton kind="roast" id={r.id} userId={user.id} />
            </div>
            <form action={updateRoast} className="flex gap-2">
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="user_id" value={user.id} />
              <input name="content" defaultValue={r.content} className="flex-1 bg-[#0A0A0A] text-white border border-brand-border p-2 rounded-sm font-mono text-sm" />
              <button className="text-latent-gold text-xs font-display font-black uppercase hover:text-white transition-colors px-2">Save</button>
            </form>
          </div>
        ))}
        {(!roasts || roasts.length === 0) && <div className="text-white/30 font-mono text-sm">No roasts.</div>}
      </section>

      {/* Votes */}
      <section className="bg-[#111111] border border-brand-border p-6 rounded-md space-y-2">
        <h2 className="text-xl font-display font-black uppercase text-white border-b border-white/10 pb-2">Votes ({votes?.length || 0})</h2>
        {votes?.map((v) => (
          <div key={v.id} className="flex justify-between items-center bg-[#050505] border border-brand-border p-3 rounded-sm font-mono text-sm text-white/70">
            <span>S{v.Episode?.season_number}E{v.Episode?.episode_number} — {v.Contestant?.name}: <span className="text-latent-gold">{v.score}</span></span>
            <DeleteButton kind="vote" id={v.id} userId={user.id} />
          </div>
        ))}
        {(!votes || votes.length === 0) && <div className="text-white/30 font-mono text-sm">No votes.</div>}
      </section>

      {/* Predictions */}
      <section className="bg-[#111111] border border-brand-border p-6 rounded-md space-y-2">
        <h2 className="text-xl font-display font-black uppercase text-white border-b border-white/10 pb-2">Predictions ({predictions?.length || 0})</h2>
        {predictions?.map((p) => (
          <div key={p.id} className="flex justify-between items-center bg-[#050505] border border-brand-border p-3 rounded-sm font-mono text-sm text-white/70">
            <span>S{p.Episode?.season_number}E{p.Episode?.episode_number} — {p.points_earned ?? 0} pts</span>
            <DeleteButton kind="prediction" id={p.id} userId={user.id} />
          </div>
        ))}
        {(!predictions || predictions.length === 0) && <div className="text-white/30 font-mono text-sm">No predictions.</div>}
      </section>
    </div>
  );
}
