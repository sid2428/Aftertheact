import { getServiceSupabase } from "@/lib/supabase";
import Link from "next/link";

export const revalidate = 0;

export default async function AdminUsers() {
  const supabase = getServiceSupabase();
  const { data: users } = await supabase
    .from("User")
    .select("id, username, email, latent_points_alltime, trust_score, is_shadow_banned, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-black uppercase text-white">Users</h1>
        <p className="text-white/50 mt-1">View members and manage their activity.</p>
      </div>

      <div className="bg-[#111111] border border-brand-border rounded-md overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_1fr_100px_100px] gap-4 p-3 bg-[#050505] text-white/50 font-display font-black uppercase text-xs">
          <div>User</div><div>Email</div><div className="text-right">Points</div><div className="text-right">Manage</div>
        </div>
        {users?.map((u) => (
          <div key={u.id} className="grid sm:grid-cols-[1fr_1fr_100px_100px] gap-4 p-3 border-t border-brand-border items-center">
            <div className="font-display font-black text-white flex items-center gap-2">
              {u.username}
              {u.is_shadow_banned && <span className="text-[10px] bg-latent-crimson/20 text-latent-crimson px-1.5 py-0.5 rounded-sm">BANNED</span>}
            </div>
            <div className="text-white/50 font-mono text-sm truncate">{u.email}</div>
            <div className="text-right font-mono text-latent-gold">{u.latent_points_alltime}</div>
            <div className="text-right">
              <Link href={`/admin/users/${u.id}`} className="text-latent-gold text-sm hover:underline">Open →</Link>
            </div>
          </div>
        ))}
        {(!users || users.length === 0) && <div className="p-6 text-white/30 font-mono">No users yet.</div>}
      </div>
    </div>
  );
}
