import { getServiceSupabase } from "@/lib/supabase";
import Link from "next/link";
import { HeroStagger, HeroItem } from "@/components/HomeClientWrapper";
import DivergenceSeismograph from "@/components/DivergenceSeismograph";

export const revalidate = 60;

export default async function Home() {
  const supabase = getServiceSupabase();
  const { data: episodes } = await supabase
    .from("Episode")
    .select("*")
    .order("season_number", { ascending: false })
    .order("episode_number", { ascending: false })
    .limit(10);

  return (
    <div className="selection:bg-broadcast-red/30">
      
      {/* Hero Section */}
      <div className="min-h-[85vh] flex flex-col items-center justify-center relative border-b-8 border-brand-black bg-brand-white px-6">
        <HeroStagger>
          <HeroItem>
            <div className="inline-block bg-brand-black text-white px-6 py-2 font-display font-black uppercase tracking-widest mb-6 shadow-[4px_4px_0px_0px_#E53935]">
              The Hate Engine 🚂
            </div>
          </HeroItem>
          <HeroItem>
            <h1 className="text-7xl sm:text-9xl md:text-[10rem] font-display font-black tracking-tighter uppercase leading-[0.85] text-brand-black">
              JUDGE THE<br/><span className="text-broadcast-red relative inline-block">
                JUDGES
                <span className="absolute -bottom-2 sm:-bottom-4 left-0 w-full h-2 sm:h-4 bg-brand-black" />
              </span><br/>🧑‍⚖️
            </h1>
          </HeroItem>
          <HeroItem>
            <p className="text-xl sm:text-3xl text-brand-black/70 max-w-3xl mx-auto font-medium mt-8 leading-snug">
              Vote live. Ruin dreams. Roast the acts. Prove you have better taste than the actual judges (you don't). 💅📉
            </p>
          </HeroItem>
          <HeroItem className="pt-12 flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/scoreboard" className="bg-brand-black text-white border-4 border-brand-black font-display font-black uppercase tracking-widest px-10 py-5 hover:bg-white hover:text-brand-black transition-colors shadow-[8px_8px_0px_0px_#0A0A0A] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#0A0A0A]">
              View Scoreboard
            </Link>
            <Link href="/api/auth/signin" className="bg-white text-brand-black border-4 border-brand-black font-display font-black uppercase tracking-widest px-10 py-5 hover:bg-brand-gray transition-colors shadow-[8px_8px_0px_0px_#E53935] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#E53935]">
              Join the Jury
            </Link>
          </HeroItem>
        </HeroStagger>
        
        {/* Scroll Down Indicator */}
        <div className="absolute bottom-12 flex flex-col items-center gap-2">
          <span className="text-xs font-display font-black uppercase tracking-widest text-brand-black/50">Scroll to view</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-broadcast-red animate-bounce"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
        </div>
      </div>

      {/* Divergence Seismograph & Episodes Feed - Scrolled down */}
      <section className="max-w-7xl mx-auto p-6 sm:p-12 mt-12 sm:mt-24 mb-32 space-y-16">
        
        <DivergenceSeismograph divergenceValue={2.45} history={[0.5, 1.2, -0.8, 2.1, 3.5, 1.8, 0.2, -1.5, 2.45]} />

        <div className="space-y-8">
          <div className="flex justify-between items-end border-b-4 border-brand-black pb-2">
            <h2 className="text-3xl font-display font-black uppercase tracking-widest text-brand-black">Episode Directory</h2>
          </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {episodes && episodes.map(ep => (
            <Link key={ep.id} href={`/episode/${ep.id}`} className="group block bg-white border-4 border-brand-black hover:border-broadcast-red hover:shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] transition-all relative overflow-hidden">
              
              <div className="p-6 relative z-10 flex flex-col h-full justify-between min-h-[200px]">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="font-display font-black text-5xl text-brand-black/20 group-hover:text-brand-black transition-colors">
                      E{ep.episode_number}
                    </div>
                    <span className={`px-2 py-1 text-[10px] font-display font-black uppercase tracking-widest border-2 ${
                      ep.status === 'LIVE' ? 'bg-broadcast-red text-white border-broadcast-red animate-pulse-fast' : 
                      ep.status === 'UPCOMING' ? 'bg-brand-gray text-brand-black/50 border-brand-black/20' :
                      'bg-brand-black text-white border-brand-black'
                    }`}>
                      {ep.status}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-display font-black uppercase leading-tight mb-2">S{ep.season_number} — {ep.title}</h3>
                  <div className="text-sm font-mono font-bold text-brand-black/50">Air: {new Date(ep.air_date).toLocaleDateString()}</div>
                </div>
                
                <div className="mt-8 text-sm font-display font-black text-broadcast-red uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                  {ep.status === 'LIVE' ? 'Vote Now' : ep.status === 'UPCOMING' ? 'Predict Now' : 'View Results'}
                  <span>→</span>
                </div>
              </div>
            </Link>
          ))}
          
          {(!episodes || episodes.length === 0) && (
            <div className="col-span-full py-16 text-center text-brand-black/50 font-display font-black uppercase tracking-widest text-2xl border-4 border-dashed border-brand-black/20">
              No episodes logged. The acts are still preparing their sob stories. 🎻😭
            </div>
          )}
        </div>
        </div>
      </section>

    </div>
  );
}
