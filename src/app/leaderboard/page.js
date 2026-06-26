import { getServiceSupabase } from "@/lib/supabase";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Image from "next/image";
import RollingNumber from "@/components/RollingNumber";
import TypeOnce from "@/components/TypeOnce";
import { Crown } from "lucide-react";

export const metadata = {
  title: "The Leaderboards | Oracle Accuracy and Season Standings",
  description: "The sharpest predictors and the highest-ranked jurors of the season.",
};

export const revalidate = 30;

function Badge({ children }) {
  return (
    <span className="shrink-0 border-2 border-oracle-gold bg-[#120f02] px-2 py-0.5 font-display text-[10px] font-black uppercase tracking-widest text-oracle-gold">
      {children}
    </span>
  );
}

function Avatar({ user, highlight = false }) {
  return (
    <div className={`relative h-10 w-10 shrink-0 overflow-hidden border-4 bg-brand-gray sm:h-12 sm:w-12 ${highlight ? "border-oracle-gold" : "border-white/15"}`}>
      {highlight && <Crown className="absolute right-0 top-0 z-10 h-4 w-4 bg-brand-black text-oracle-gold" strokeWidth={2.5} />}
      {user.avatar_url ? (
        <Image src={user.avatar_url} alt={user.username} fill sizes="48px" className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-display text-xl font-black uppercase text-white/25">
          {user.username[0]}
        </div>
      )}
    </div>
  );
}

export default async function LeaderboardPage() {
  const supabase = getServiceSupabase();
  const session = await getServerSession(authOptions);

  // Two independent top-50 reads — run them together (saves a round-trip).
  const [{ data: topUsers }, { data: oracles }] = await Promise.all([
    supabase
      .from("User")
      .select("id, username, latent_points_alltime, latent_points_season, badges, avatar_url")
      .order("latent_points_season", { ascending: false })
      .limit(10),
    supabase
      .from("User")
      .select("id, username, oracle_score, oracle_qualifying_episodes, avatar_url, badges")
      .gte("oracle_qualifying_episodes", 1)
      .order("oracle_score", { ascending: false })
      .limit(10),
  ]);

  // The signed-in viewer's own standing — always shown as a separate pinned row
  // beneath each top-10 table so they can find themselves at a glance, with a
  // note when they're already in the visible top 10.
  let seasonSelf = null; // { user, rank, inTop } for the Season Standing table
  let oracleSelf = null; // { user, rank, inTop, qualified } for Prophet's Wall
  if (session?.user?.id) {
    const { data: me } = await supabase
      .from("User")
      .select("id, username, latent_points_alltime, latent_points_season, badges, avatar_url, oracle_score, oracle_qualifying_episodes")
      .eq("id", session.user.id)
      .single();

    if (me) {
      // Rank = how many users score strictly higher, plus one.
      const { count: higherSeason } = await supabase
        .from("User")
        .select("id", { count: "exact", head: true })
        .gt("latent_points_season", me.latent_points_season || 0);
      seasonSelf = {
        user: me,
        rank: (higherSeason || 0) + 1,
        inTop: topUsers?.some((u) => u.id === me.id) ?? false,
      };

      // Only ranked on the Oracle wall once they have a qualifying episode.
      const qualified = (me.oracle_qualifying_episodes || 0) >= 1;
      let oracleRank = null;
      if (qualified) {
        const { count: higherOracle } = await supabase
          .from("User")
          .select("id", { count: "exact", head: true })
          .gte("oracle_qualifying_episodes", 1)
          .gt("oracle_score", me.oracle_score || 0);
        oracleRank = (higherOracle || 0) + 1;
      }
      oracleSelf = {
        user: me,
        rank: oracleRank,
        qualified,
        inTop: oracles?.some((u) => u.id === me.id) ?? false,
      };
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg text-white selection:bg-broadcast-red/30">
      <section className="border-b-4 border-broadcast-red bg-[#080808] px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <h1 className="border-b-8 border-white/15 pb-4 font-display text-6xl font-black uppercase tracking-tight text-white sm:text-8xl">
            <TypeOnce text="The Leaderboards" sessionKey="hero-leaderboards" speed={55} />
          </h1>
          <p className="mt-4 font-mono text-sm font-black uppercase tracking-[var(--letter-spacing-scoreboard)] text-white/45">
            Season 2 standings - updated every 30 seconds.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl space-y-16">
          <section className="space-y-6">
            <div className="flex items-end justify-between border-b-4 border-white/15 pb-3">
              <h2 className="font-display text-4xl font-black uppercase tracking-tight text-white">Season Standing</h2>
              <span className="font-display text-xs font-black uppercase tracking-widest text-white/45">By Latent Pts</span>
            </div>

            <div className="border-4 border-white/15 bg-brand-panel shadow-[var(--shadow-brutal-md)]">
              {topUsers?.map((user, idx) => (
                <div
                  key={user.id}
                  className={`group brutal-scroll-row relative flex items-center gap-2.5 border-b-4 border-white/10 p-3 transition-colors last:border-b-0 hover:bg-white/[0.04] sm:gap-4 sm:p-4 ${
                    idx === 0 ? "bg-oracle-gold/[0.08]" : ""
                  }`}
                >
                  <div className="w-7 shrink-0 text-center font-mono text-2xl font-black text-white/20 transition-colors group-hover:text-broadcast-red sm:w-12 sm:text-4xl">
                    #{idx + 1}
                  </div>
                  <Avatar user={user} highlight={idx === 0} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-base font-black uppercase tracking-tight text-white transition-colors group-hover:text-oracle-gold sm:text-2xl">
                      {user.username}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <RollingNumber value={user.latent_points_season || 0} decimals={0} height={30} className="justify-end font-bold text-broadcast-red" />
                    <div className="font-display text-[10px] font-black uppercase tracking-widest text-white/40">Points</div>
                  </div>
                </div>
              ))}

              {(!topUsers || topUsers.length === 0) && (
                <div className="border-4 border-dashed border-white/15 py-16 text-center font-display text-xl font-black uppercase tracking-widest text-white/35">
                  No users ranked yet.
                </div>
              )}
            </div>

            {seasonSelf && (
              <div className="mt-5">
                <div className="mb-2 font-display text-[10px] font-black uppercase tracking-widest text-white/40">Your Position</div>
                <div className="border-4 border-oracle-gold bg-oracle-gold/[0.08] shadow-[var(--shadow-brutal-md)]">
                  <div className="group relative flex items-center gap-2.5 p-3 sm:gap-4 sm:p-4">
                    <div className="w-7 shrink-0 text-center font-mono text-2xl font-black text-oracle-gold sm:w-12 sm:text-4xl">
                      #{seasonSelf.rank}
                    </div>
                    <Avatar user={seasonSelf.user} highlight />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-base font-black uppercase tracking-tight text-oracle-gold sm:text-2xl">
                        {seasonSelf.user.username}
                      </div>
                      <div className="font-display text-[10px] font-black uppercase tracking-widest text-white/40">
                        {seasonSelf.inTop ? "You · In the top 10" : "You"}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <RollingNumber value={seasonSelf.user.latent_points_season || 0} decimals={0} height={30} className="justify-end font-bold text-broadcast-red" />
                      <div className="font-display text-[10px] font-black uppercase tracking-widest text-white/40">Points</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-6">
            <div className="flex items-end justify-between border-b-4 border-white/15 pb-3">
              <h2 className="font-display text-4xl font-black uppercase tracking-tight text-white">Prophet&apos;s Wall</h2>
              <span className="font-display text-xs font-black uppercase tracking-widest text-white/45">Oracle System</span>
            </div>

            <div className="border-4 border-white/15 bg-brand-panel shadow-[var(--shadow-brutal-md)]">
              {oracles?.map((user, idx) => (
                <div
                  key={user.id}
                  className={`group brutal-scroll-row relative flex items-center gap-3 border-b-4 border-white/10 px-3 py-4 transition-colors last:border-b-0 hover:bg-white/[0.04] sm:gap-4 sm:px-4 sm:py-5 ${
                    idx === 0 ? "border-l-8 border-l-oracle-gold bg-oracle-gold/[0.08]" : "border-l-8 border-l-transparent"
                  }`}
                >
                  <div className="w-7 shrink-0 text-center font-mono text-xl font-black text-white/20 transition-colors group-hover:text-oracle-green sm:w-10 sm:text-3xl">
                    #{idx + 1}
                  </div>
                  <Avatar user={user} highlight={idx === 0} />
                  <div className="min-w-0 flex-1">
                    <div className={`truncate font-display text-sm font-black uppercase tracking-tight transition-colors sm:text-xl ${
                      idx === 0 ? "text-oracle-gold" : "text-white group-hover:text-oracle-green"
                    }`}>
                      {user.username}
                    </div>
                    <div className="mt-1 truncate font-display text-[9px] font-black uppercase tracking-widest text-white/40 sm:text-[10px]">
                      {user.oracle_qualifying_episodes} predictions
                    </div>
                  </div>
                  <div className="shrink-0 min-w-[60px] text-right sm:min-w-[80px]">
                    <div className="flex items-baseline justify-end">
                      <RollingNumber value={(user.oracle_score || 0) * 100} decimals={1} height={24} className="justify-end font-bold text-oracle-green" />
                      <span className="font-number text-base font-bold text-oracle-green sm:text-xl">%</span>
                    </div>
                    <div className="font-display text-[9px] font-black uppercase tracking-widest text-white/40 sm:text-[10px]">Accuracy</div>
                  </div>
                </div>
              ))}

              {(!oracles || oracles.length === 0) && (
                <div className="border-4 border-dashed border-oracle-green/25 px-6 py-16 text-center font-display text-xl font-black uppercase tracking-widest text-white/40">
                  Oracle Board khaali hai. 5 episodes dekho pehle, bhai.
                </div>
              )}
            </div>

            {oracleSelf && (
              <div className="mt-5">
                <div className="mb-2 font-display text-[10px] font-black uppercase tracking-widest text-white/40">Your Position</div>
                <div className="border-4 border-oracle-gold bg-oracle-gold/[0.08] shadow-[var(--shadow-brutal-md)]">
                  <div className="group relative flex items-center gap-3 border-l-8 border-l-oracle-gold px-3 py-4 sm:gap-4 sm:px-4 sm:py-5">
                    <div className="w-7 shrink-0 text-center font-mono text-xl font-black text-oracle-gold sm:w-10 sm:text-3xl">
                      {oracleSelf.qualified ? `#${oracleSelf.rank}` : "—"}
                    </div>
                    <Avatar user={oracleSelf.user} highlight />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-sm font-black uppercase tracking-tight text-oracle-gold sm:text-xl">
                        {oracleSelf.user.username}
                      </div>
                      <div className="mt-1 truncate font-display text-[9px] font-black uppercase tracking-widest text-white/40 sm:text-[10px]">
                        {oracleSelf.qualified
                          ? `${oracleSelf.inTop ? "You · In the top 10 · " : "You · "}${oracleSelf.user.oracle_qualifying_episodes} predictions`
                          : "You · Not ranked yet — make more predictions"}
                      </div>
                    </div>
                    <div className="shrink-0 min-w-[60px] text-right sm:min-w-[80px]">
                      <div className="flex items-baseline justify-end">
                        <RollingNumber value={(oracleSelf.user.oracle_score || 0) * 100} decimals={1} height={24} className="justify-end font-bold text-oracle-green" />
                        <span className="font-number text-base font-bold text-oracle-green sm:text-xl">%</span>
                      </div>
                      <div className="font-display text-[9px] font-black uppercase tracking-widest text-white/40 sm:text-[10px]">Accuracy</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
