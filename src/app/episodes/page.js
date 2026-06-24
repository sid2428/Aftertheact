import { getServiceSupabase } from "@/lib/supabase";
import EpisodeDirectory from "@/components/EpisodeDirectory";

export const metadata = {
  title: "The Lineup",
  description: "Every episode of the trial. Vote on the live ones, relive the verdicts.",
};

export const revalidate = 60;

export default async function EpisodesPage() {
  const supabase = getServiceSupabase();
  const { data: episodes } = await supabase
    .from("Episode")
    .select("*")
    .order("episode_number", { ascending: false });

  const recent = (episodes || []).slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[40vh] flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,_var(--tw-gradient-stops))] from-latent-crimson/8 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-12 flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
          <h1 className="text-6xl sm:text-8xl md:text-[8rem] font-display font-black tracking-tighter uppercase text-white leading-[0.85] drop-shadow-2xl">
            THE<br />LINEUP
          </h1>

          {/* Recent episode posters */}
          {recent.length > 0 && (
            <div className="hidden md:flex gap-4">
              {recent.map((ep, i) => (
                <div
                  key={ep.id}
                  className="relative w-32 h-44 lg:w-40 lg:h-56 rounded-md overflow-hidden border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] shrink-0"
                  style={{ transform: `rotate(${[-4, 0, 4][i]}deg)` }}
                >
                  {ep.thumbnail_url ? (
                    <img src={ep.thumbnail_url} alt={ep.title} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-[#1a1a1a] to-[#050505] flex items-center justify-center">
                      <span className="font-display font-black text-5xl text-white/10">E{ep.episode_number}</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <div className="font-display font-black uppercase text-[10px] text-white/80 truncate tracking-widest">{ep.title}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto p-6 sm:p-12 mt-4 mb-32 relative z-20">
        <EpisodeDirectory episodes={episodes || []} />
      </section>
    </>
  );
}
