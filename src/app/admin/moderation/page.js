import { getServiceSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export default async function ModerationQueue() {
  const supabase = getServiceSupabase();

  // Fetch roasts in HELD state
  const { data: heldRoasts } = await supabase
    .from("Roast")
    .select("*, User(username, trust_score), Contestant(name)")
    .eq("moderation_status", "HELD")
    .order("created_at", { ascending: true });

  async function moderateAction(formData) {
    "use server";
    const supabaseServer = getServiceSupabase();
    
    const roastId = formData.get("roastId");
    const action = formData.get("action"); // 'APPROVE', 'REMOVE', 'SHADOW_BAN'
    const userId = formData.get("userId");

    if (action === "APPROVE") {
      await supabaseServer.from("Roast").update({ moderation_status: "PUBLISHED" }).eq("id", roastId);
    } else if (action === "REMOVE") {
      await supabaseServer.from("Roast").update({ moderation_status: "REMOVED" }).eq("id", roastId);
    } else if (action === "SHADOW_BAN") {
      await supabaseServer.from("Roast").update({ moderation_status: "REMOVED" }).eq("id", roastId);
      await supabaseServer.from("User").update({ is_shadow_banned: true }).eq("id", userId);
    }

    // Log the moderation action
    await supabaseServer.from("ModerationLog").insert({
      roast_id: roastId,
      action: action === "APPROVE" ? "APPROVED" : (action === "REMOVE" ? "REMOVED" : "SHADOW_BANNED"),
      reason_category: "Manual Review"
    });

    revalidatePath("/admin/moderation");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-rose-500">Moderation Queue</h1>
        <p className="text-neutral-400 mt-2">Tier 3: Human review. Auto-held and reported items land here.</p>
      </div>

      <div className="space-y-4">
        {heldRoasts && heldRoasts.length > 0 ? (
          heldRoasts.map(roast => (
            <div key={roast.id} className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex flex-col md:flex-row gap-6 justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white">{roast.User.username}</span>
                  <span className="text-xs bg-neutral-800 px-2 py-1 rounded text-neutral-400">Trust: {roast.User.trust_score?.toFixed(2)}</span>
                  <span className="text-xs text-neutral-500">→ {roast.Contestant.name}</span>
                </div>
                <p className="text-neutral-300 font-medium bg-neutral-950 p-4 rounded-lg border border-neutral-800 whitespace-pre-wrap">
                  {roast.content}
                </p>
                <div className="text-xs text-rose-500 font-bold uppercase tracking-widest">
                  Flagged by Tier 1 Auto-Filter
                </div>
              </div>

              <div className="flex flex-row md:flex-col gap-2 shrink-0">
                <form action={moderateAction}>
                  <input type="hidden" name="roastId" value={roast.id} />
                  <input type="hidden" name="userId" value={roast.user_id} />
                  <input type="hidden" name="action" value="APPROVE" />
                  <button type="submit" className="w-full bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/30 px-4 py-2 font-bold rounded text-sm transition-colors">
                    Approve
                  </button>
                </form>
                <form action={moderateAction}>
                  <input type="hidden" name="roastId" value={roast.id} />
                  <input type="hidden" name="userId" value={roast.user_id} />
                  <input type="hidden" name="action" value="REMOVE" />
                  <button type="submit" className="w-full bg-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white border border-orange-500/30 px-4 py-2 font-bold rounded text-sm transition-colors">
                    Remove
                  </button>
                </form>
                <form action={moderateAction}>
                  <input type="hidden" name="roastId" value={roast.id} />
                  <input type="hidden" name="userId" value={roast.user_id} />
                  <input type="hidden" name="action" value="SHADOW_BAN" />
                  <button type="submit" className="w-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 px-4 py-2 font-bold rounded text-sm transition-colors">
                    Shadow Ban
                  </button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-neutral-600 italic border border-dashed border-neutral-800 rounded-2xl">
            Queue is empty. Everything is clean.
          </div>
        )}
      </div>
    </div>
  );
}
