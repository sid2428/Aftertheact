import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = {};
for (const line of readFileSync("./.env","utf8").split("\n")) { const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if(m) env[m[1]]=m[2].replace(/^["']|["']$/g,""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("Episode").select("id,season_number,episode_number,title,status,is_revelation_triggered,voting_window_close").eq("status","LIVE").eq("is_revelation_triggered",true);
const now = Date.now();
for (const e of data||[]) {
  const close = e.voting_window_close ? new Date(e.voting_window_close).getTime() : null;
  console.log(`S${e.season_number}E${e.episode_number} "${e.title}" (${e.id})`);
  console.log("  status:", e.status, "| triggered:", e.is_revelation_triggered);
  console.log("  voting_window_close:", e.voting_window_close, close ? (close<=now?"(PAST)":"(FUTURE — voting still open)") : "(NULL)");
  console.log("  now:", new Date(now).toISOString());
}
